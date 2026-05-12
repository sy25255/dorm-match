package com.dormmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dormmatch.common.BusinessException;
import com.dormmatch.dto.SurveySubmitRequest;
import com.dormmatch.entity.Student;
import com.dormmatch.entity.SurveyAnswer;
import com.dormmatch.entity.SurveyQuestion;
import com.dormmatch.mapper.StudentMapper;
import com.dormmatch.mapper.SurveyAnswerMapper;
import com.dormmatch.mapper.SurveyQuestionMapper;
import com.dormmatch.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyQuestionMapper questionMapper;
    private final SurveyAnswerMapper answerMapper;
    private final StudentMapper studentMapper;

    @Override
    public List<SurveyQuestion> getQuestions() {
        return questionMapper.selectList(
                new LambdaQueryWrapper<SurveyQuestion>()
                        .eq(SurveyQuestion::getStatus, 1)
                        .orderByAsc(SurveyQuestion::getSortOrder)
        );
    }

    @Override
    public Map<String, Object> getProgress(Long studentId) {
        List<SurveyQuestion> allQuestions = getQuestions();
        List<SurveyAnswer> answers = answerMapper.selectList(
                new LambdaQueryWrapper<SurveyAnswer>()
                        .eq(SurveyAnswer::getStudentId, studentId)
        );

        Set<Long> answeredIds = answers.stream()
                .map(SurveyAnswer::getQuestionId)
                .collect(Collectors.toSet());

        long answeredCount = allQuestions.stream()
                .filter(q -> answeredIds.contains(q.getId()))
                .count();

        Map<String, Object> progress = new HashMap<>();
        progress.put("total", allQuestions.size());
        progress.put("answered", (int) answeredCount);
        progress.put("percentage", allQuestions.isEmpty() ? 0 :
                Math.round(answeredCount * 100.0 / allQuestions.size()));
        return progress;
    }

    @Override
    public void saveDraft(Long studentId, List<SurveySubmitRequest.AnswerItem> answers) {
        Student student = studentMapper.selectById(studentId);
        if (student == null) {
            throw BusinessException.notFound("学生不存在");
        }

        if (student.getSurveyStatus() == 2) {
            throw BusinessException.badRequest("问卷已完成，无法修改");
        }

        for (SurveySubmitRequest.AnswerItem item : answers) {
            SurveyAnswer answer = answerMapper.selectOne(
                    new LambdaQueryWrapper<SurveyAnswer>()
                            .eq(SurveyAnswer::getStudentId, studentId)
                            .eq(SurveyAnswer::getQuestionId, item.getQuestionId())
            );

            if (answer != null) {
                answer.setAnswerValue(item.getAnswerValue());
                answerMapper.updateById(answer);
            } else {
                answer = new SurveyAnswer();
                answer.setStudentId(studentId);
                answer.setQuestionId(item.getQuestionId());
                answer.setAnswerValue(item.getAnswerValue());
                answerMapper.insert(answer);
            }
        }

        student.setSurveyStatus(1);
        studentMapper.updateById(student);
    }

    @Override
    @Transactional
    public void submitSurvey(Long studentId, SurveySubmitRequest request) {
        Student student = studentMapper.selectById(studentId);
        if (student == null) {
            throw BusinessException.notFound("学生不存在");
        }

        if (student.getSurveyStatus() == 2) {
            throw BusinessException.badRequest("问卷已完成，不可重复提交");
        }

        List<SurveyQuestion> requiredQuestions = questionMapper.selectList(
                new LambdaQueryWrapper<SurveyQuestion>()
                        .eq(SurveyQuestion::getStatus, 1)
                        .eq(SurveyQuestion::getIsRequired, 1)
        );

        Set<Long> answeredIds = request.getAnswers().stream()
                .map(SurveySubmitRequest.AnswerItem::getQuestionId)
                .collect(Collectors.toSet());

        for (SurveyQuestion q : requiredQuestions) {
            if (!answeredIds.contains(q.getId())) {
                throw BusinessException.badRequest("必答题未完成: " + q.getQuestionText());
            }
        }

        List<SurveyQuestion> attentionQuestions = questionMapper.selectList(
                new LambdaQueryWrapper<SurveyQuestion>()
                        .eq(SurveyQuestion::getStatus, 1)
                        .eq(SurveyQuestion::getIsAttentionCheck, 1)
        );

        for (SurveyQuestion aq : attentionQuestions) {
            Optional<SurveySubmitRequest.AnswerItem> answerOpt = request.getAnswers().stream()
                    .filter(a -> a.getQuestionId().equals(aq.getId()))
                    .findFirst();

            if (answerOpt.isPresent()) {
                String expected = getExpectedAttentionAnswer(aq);
                if (expected != null && !expected.equals(answerOpt.get().getAnswerValue())) {
                    throw BusinessException.badRequest("问卷未通过注意力检测，请认真填写后重新提交");
                }
            }
        }

        answerMapper.delete(new LambdaQueryWrapper<SurveyAnswer>()
                .eq(SurveyAnswer::getStudentId, studentId));

        List<SurveyAnswer> answerList = request.getAnswers().stream().map(item -> {
            SurveyAnswer answer = new SurveyAnswer();
            answer.setStudentId(studentId);
            answer.setQuestionId(item.getQuestionId());
            answer.setAnswerValue(item.getAnswerValue());
            return answer;
        }).collect(Collectors.toList());

        for (SurveyAnswer answer : answerList) {
            answerMapper.insert(answer);
        }

        student.setSurveyStatus(2);
        student.setSurveyCompletedAt(LocalDateTime.now());
        studentMapper.updateById(student);
    }

    @Override
    public List<SurveySubmitRequest.AnswerItem> getDraft(Long studentId) {
        List<SurveyAnswer> answers = answerMapper.selectList(
                new LambdaQueryWrapper<SurveyAnswer>()
                        .eq(SurveyAnswer::getStudentId, studentId)
        );

        return answers.stream().map(a -> {
            SurveySubmitRequest.AnswerItem item = new SurveySubmitRequest.AnswerItem();
            item.setQuestionId(a.getQuestionId());
            item.setAnswerValue(a.getAnswerValue());
            return item;
        }).collect(Collectors.toList());
    }

    @Override
    public boolean hasCompletedSurvey(Long studentId) {
        Student student = studentMapper.selectById(studentId);
        return student != null && student.getSurveyStatus() == 2;
    }

    private String getExpectedAttentionAnswer(SurveyQuestion question) {
        if (question.getOptionsJson() == null) return null;
        if (question.getQuestionText().contains("选C") || question.getQuestionText().contains("选c")) {
            return "3";
        }
        return null;
    }
}
