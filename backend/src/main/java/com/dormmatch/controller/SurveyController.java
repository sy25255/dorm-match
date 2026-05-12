package com.dormmatch.controller;
import com.dormmatch.common.Result;
import com.dormmatch.dto.SurveySubmitRequest;
import com.dormmatch.entity.SurveyQuestion;
import com.dormmatch.service.SurveyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/survey")
@RequiredArgsConstructor
public class SurveyController {
    private final SurveyService surveyService;

    @GetMapping("/questions")
    public Result<List<SurveyQuestion>> getQuestions() {
        return Result.success(surveyService.getQuestions());
    }

    @GetMapping("/progress")
    public Result<Map<String, Object>> getProgress(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(surveyService.getProgress(userId));
    }

    @PostMapping("/draft")
    public Result<?> saveDraft(Authentication auth, @RequestBody SurveySubmitRequest request) {
        Long userId = (Long) auth.getPrincipal();
        surveyService.saveDraft(userId, request.getAnswers());
        return Result.success();
    }

    @GetMapping("/draft")
    public Result<List<SurveySubmitRequest.AnswerItem>> getDraft(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(surveyService.getDraft(userId));
    }

    @PostMapping("/submit")
    public Result<?> submit(Authentication auth, @Valid @RequestBody SurveySubmitRequest request) {
        Long userId = (Long) auth.getPrincipal();
        surveyService.submitSurvey(userId, request);
        return Result.success("问卷提交成功");
    }
}
