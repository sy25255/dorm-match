package com.dormmatch.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dormmatch.common.BusinessException;
import com.dormmatch.dto.MatchRecommendation;
import com.dormmatch.entity.*;
import com.dormmatch.mapper.*;
import com.dormmatch.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingServiceImpl implements MatchingService {

    private final StudentMapper studentMapper;
    private final SurveyAnswerMapper answerMapper;
    private final SurveyQuestionMapper questionMapper;
    private final MatchResultMapper matchResultMapper;

    @Value("${app.matching.weight-sleep}")
    private double weightSleep;
    @Value("${app.matching.weight-hygiene}")
    private double weightHygiene;
    @Value("${app.matching.weight-social}")
    private double weightSocial;
    @Value("${app.matching.weight-personality}")
    private double weightPersonality;
    @Value("${app.matching.weight-study}")
    private double weightStudy;
    @Value("${app.matching.weight-hobby}")
    private double weightHobby;
    @Value("${app.matching.weight-lifestyle}")
    private double weightLifestyle;
    @Value("${app.matching.weight-spending}")
    private double weightSpending;
    @Value("${app.matching.weight-psychology}")
    private double weightPsychology;
    @Value("${app.matching.top-n}")
    private int topN;

    @Override
    public void calculateMatches(Long studentId) {
        Student current = studentMapper.selectById(studentId);
        if (current == null) {
            throw BusinessException.notFound("学生不存在");
        }
        if (current.getSurveyStatus() != 2) {
            throw BusinessException.badRequest("请先完成偏好问卷");
        }

        List<SurveyQuestion> allQuestions = questionMapper.selectList(
                new LambdaQueryWrapper<SurveyQuestion>().eq(SurveyQuestion::getStatus, 1)
        );

        List<SurveyAnswer> myAnswers = answerMapper.selectList(
                new LambdaQueryWrapper<SurveyAnswer>().eq(SurveyAnswer::getStudentId, studentId)
        );

        Map<Long, String> myAnswerMap = myAnswers.stream()
                .collect(Collectors.toMap(SurveyAnswer::getQuestionId, SurveyAnswer::getAnswerValue, (a, b) -> a));

        List<Student> candidates = studentMapper.selectList(
                new LambdaQueryWrapper<Student>()
                        .eq(Student::getSurveyStatus, 2)
                        .eq(Student::getGender, current.getGender())
                        .ne(Student::getId, studentId)
                        .eq(Student::getStatus, 1)
        );

        Map<String, Double> dimensionWeights = buildDimensionWeights();
        List<MatchCandidate> scoredCandidates = new ArrayList<>();

        for (Student candidate : candidates) {
            List<SurveyAnswer> candidateAnswers = answerMapper.selectList(
                    new LambdaQueryWrapper<SurveyAnswer>().eq(SurveyAnswer::getStudentId, candidate.getId())
            );

            Map<Long, String> candidateAnswerMap = candidateAnswers.stream()
                    .collect(Collectors.toMap(SurveyAnswer::getQuestionId, SurveyAnswer::getAnswerValue, (a, b) -> a));

            Map<String, Double> dimensionScores = new LinkedHashMap<>();
            double totalScore = 0.0;

            for (String dim : dimensionWeights.keySet()) {
                double dimScore = calculateDimensionSimilarity(
                        dim, allQuestions, myAnswerMap, candidateAnswerMap
                );
                dimensionScores.put(dim, Math.round(dimScore * 10000.0) / 100.0);
                totalScore += dimScore * dimensionWeights.get(dim);
            }

            totalScore = Math.round(totalScore * 10000.0) / 100.0;

            scoredCandidates.add(new MatchCandidate(candidate, totalScore, dimensionScores));
        }

        scoredCandidates.sort((a, b) -> Double.compare(b.totalScore, a.totalScore));

        matchResultMapper.delete(new LambdaQueryWrapper<MatchResult>()
                .eq(MatchResult::getStudentId, studentId));

        int rank = 0;
        for (MatchCandidate mc : scoredCandidates) {
            MatchResult result = new MatchResult();
            result.setStudentId(studentId);
            result.setTargetId(mc.student.getId());
            result.setTotalScore(mc.totalScore);
            result.setScoreDetail(JSONUtil.toJsonStr(mc.dimensionScores));
            result.setIsRecommended(rank < topN ? 1 : 0);
            result.setCalculatedAt(LocalDateTime.now());
            matchResultMapper.insert(result);
            rank++;
        }

        log.info("匹配计算完成: studentId={}, candidates={}", studentId, scoredCandidates.size());
    }

    @Override
    public List<MatchRecommendation> getRecommendations(Long studentId) {
        List<MatchResult> results = matchResultMapper.selectList(
                new LambdaQueryWrapper<MatchResult>()
                        .eq(MatchResult::getStudentId, studentId)
                        .eq(MatchResult::getIsRecommended, 1)
                        .orderByDesc(MatchResult::getTotalScore)
                        .last("LIMIT " + topN)
        );

        return results.stream()
                .map(r -> convertToRecommendation(studentId, r))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getMatchDetail(Long studentId, Long targetId) {
        MatchResult result = matchResultMapper.selectOne(
                new LambdaQueryWrapper<MatchResult>()
                        .eq(MatchResult::getStudentId, studentId)
                        .eq(MatchResult::getTargetId, targetId)
        );

        if (result == null) {
            throw BusinessException.notFound("匹配记录不存在");
        }

        Student target = studentMapper.selectById(targetId);
        if (target == null) {
            throw BusinessException.notFound("目标学生不存在");
        }

        Map<String, Object> detail = new HashMap<>();
        detail.put("studentId", target.getId());
        detail.put("name", target.getRealName());
        detail.put("avatarUrl", target.getAvatarUrl());
        detail.put("collegeId", target.getCollegeId());
        detail.put("majorId", target.getMajorId());
        detail.put("bio", target.getBio());
        detail.put("hometown", target.getHometown());
        detail.put("totalScore", result.getTotalScore());

        if (result.getScoreDetail() != null) {
            detail.put("dimensionScores", JSONUtil.parseObj(result.getScoreDetail()));
        }

        detail.put("commonTags", findCommonTags(studentId, targetId));

        return detail;
    }

    @Override
    public List<MatchRecommendation> searchRoommates(Long studentId, String keyword, Long collegeId, Long majorId, String hobby) {
        Student current = studentMapper.selectById(studentId);
        if (current == null) {
            throw BusinessException.notFound("学生不存在");
        }

        LambdaQueryWrapper<Student> wrapper = new LambdaQueryWrapper<Student>()
                .eq(Student::getSurveyStatus, 2)
                .eq(Student::getGender, current.getGender())
                .ne(Student::getId, studentId)
                .eq(Student::getStatus, 1);

        if (collegeId != null) {
            wrapper.eq(Student::getCollegeId, collegeId);
        }
        if (majorId != null) {
            wrapper.eq(Student::getMajorId, majorId);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Student::getRealName, keyword)
                    .or().like(Student::getBio, keyword)
                    .or().like(Student::getHometown, keyword));
        }

        List<Student> candidates = studentMapper.selectList(wrapper);

        List<MatchRecommendation> recommendations = new ArrayList<>();
        for (Student candidate : candidates) {
            MatchResult result = matchResultMapper.selectOne(
                    new LambdaQueryWrapper<MatchResult>()
                            .eq(MatchResult::getStudentId, studentId)
                            .eq(MatchResult::getTargetId, candidate.getId())
            );

            double score = result != null ? result.getTotalScore() : 0.0;

            MatchRecommendation rec = MatchRecommendation.builder()
                    .studentId(candidate.getId())
                    .name(candidate.getRealName())
                    .avatarUrl(candidate.getAvatarUrl())
                    .collegeName(String.valueOf(candidate.getCollegeId()))
                    .majorName(String.valueOf(candidate.getMajorId()))
                    .bio(candidate.getBio())
                    .matchScore(score)
                    .build();
            recommendations.add(rec);
        }

        recommendations.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        return recommendations;
    }

    private double calculateDimensionSimilarity(String dimension, List<SurveyQuestion> allQuestions,
                                                  Map<Long, String> myAnswers, Map<Long, String> otherAnswers) {
        List<SurveyQuestion> dimQuestions = allQuestions.stream()
                .filter(q -> dimension.equals(q.getDimension()))
                .collect(Collectors.toList());

        if (dimQuestions.isEmpty()) return 0.0;

        double totalSim = 0.0;
        int count = 0;

        for (SurveyQuestion q : dimQuestions) {
            String myVal = myAnswers.get(q.getId());
            String otherVal = otherAnswers.get(q.getId());

            if (myVal == null && otherVal == null) continue;
            if (myVal == null || otherVal == null) {
                totalSim += 0.0;
                count++;
                continue;
            }

            double sim = calculateQuestionSimilarity(q, myVal, otherVal);
            totalSim += sim;
            count++;
        }

        return count > 0 ? totalSim / count : 0.0;
    }

    private double calculateQuestionSimilarity(SurveyQuestion question, String valA, String valB) {
        return switch (question.getQuestionType()) {
            case "LIKERT5", "LIKERT7" -> {
                try {
                    int a = Integer.parseInt(valA);
                    int b = Integer.parseInt(valB);
                    int maxVal = "LIKERT7".equals(question.getQuestionType()) ? 7 : 5;
                    yield 1.0 - Math.abs(a - b) * 1.0 / (maxVal - 1);
                } catch (NumberFormatException e) {
                    yield valA.equals(valB) ? 1.0 : 0.0;
                }
            }
            case "SINGLE_CHOICE" -> valA.equals(valB) ? 1.0 : 0.0;
            case "MULTI_CHOICE" -> {
                Set<String> setA = new HashSet<>(Arrays.asList(valA.split(",")));
                Set<String> setB = new HashSet<>(Arrays.asList(valB.split(",")));
                if (setA.isEmpty() && setB.isEmpty()) yield 1.0;
                if (setA.isEmpty() || setB.isEmpty()) yield 0.0;
                Set<String> intersection = new HashSet<>(setA);
                intersection.retainAll(setB);
                Set<String> union = new HashSet<>(setA);
                union.addAll(setB);
                yield intersection.size() * 1.0 / union.size();
            }
            default -> valA.equalsIgnoreCase(valB) ? 1.0 : 0.0;
        };
    }

    private Map<String, Double> buildDimensionWeights() {
        Map<String, Double> weights = new LinkedHashMap<>();
        weights.put("SLEEP", weightSleep);
        weights.put("HYGIENE", weightHygiene);
        weights.put("LIFESTYLE", weightLifestyle);
        weights.put("SOCIAL", weightSocial);
        weights.put("PERSONALITY", weightPersonality);
        weights.put("STUDY", weightStudy);
        weights.put("HOBBY", weightHobby);
        weights.put("SPENDING", weightSpending);
        weights.put("PSYCHOLOGY", weightPsychology);
        return weights;
    }

    private MatchRecommendation convertToRecommendation(Long studentId, MatchResult result) {
        Student target = studentMapper.selectById(result.getTargetId());
        if (target == null) return null;

        Map<String, Double> dimensionScores = new HashMap<>();
        if (result.getScoreDetail() != null) {
            Map<String, Object> raw = JSONUtil.parseObj(result.getScoreDetail());
            raw.forEach((k, v) -> dimensionScores.put(k, Double.valueOf(v.toString())));
        }

        return MatchRecommendation.builder()
                .studentId(target.getId())
                .name(target.getRealName())
                .avatarUrl(target.getAvatarUrl())
                .collegeName(String.valueOf(target.getCollegeId()))
                .majorName(String.valueOf(target.getMajorId()))
                .bio(target.getBio())
                .matchScore(result.getTotalScore())
                .dimensionScores(dimensionScores)
                .commonTags(findCommonTags(studentId, target.getId()))
                .build();
    }

    private List<String> findCommonTags(Long studentA, Long studentB) {
        List<SurveyAnswer> answersA = answerMapper.selectList(
                new LambdaQueryWrapper<SurveyAnswer>().eq(SurveyAnswer::getStudentId, studentA));
        List<SurveyAnswer> answersB = answerMapper.selectList(
                new LambdaQueryWrapper<SurveyAnswer>().eq(SurveyAnswer::getStudentId, studentB));

        Map<Long, String> mapA = answersA.stream()
                .collect(Collectors.toMap(SurveyAnswer::getQuestionId, SurveyAnswer::getAnswerValue));
        Map<Long, String> mapB = answersB.stream()
                .collect(Collectors.toMap(SurveyAnswer::getQuestionId, SurveyAnswer::getAnswerValue));

        List<String> commonTags = new ArrayList<>();
        List<SurveyQuestion> hobbyQuestions = questionMapper.selectList(
                new LambdaQueryWrapper<SurveyQuestion>()
                        .eq(SurveyQuestion::getDimension, "HOBBY")
                        .eq(SurveyQuestion::getQuestionType, "MULTI_CHOICE")
        );

        for (SurveyQuestion q : hobbyQuestions) {
            String valA = mapA.get(q.getId());
            String valB = mapB.get(q.getId());
            if (valA != null && valB != null && !valA.isBlank() && !valB.isBlank()) {
                Set<String> setA = new HashSet<>(Arrays.asList(valA.split(",")));
                Set<String> setB = new HashSet<>(Arrays.asList(valB.split(",")));
                setA.retainAll(setB);
                if (!setA.isEmpty()) {
                    commonTags.addAll(setA);
                }
            }
        }

        return commonTags.stream().distinct().limit(5).collect(Collectors.toList());
    }

    private static class MatchCandidate {
        final Student student;
        final double totalScore;
        final Map<String, Double> dimensionScores;

        MatchCandidate(Student student, double totalScore, Map<String, Double> dimensionScores) {
            this.student = student;
            this.totalScore = totalScore;
            this.dimensionScores = dimensionScores;
        }
    }
}
