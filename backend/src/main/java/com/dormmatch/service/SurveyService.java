package com.dormmatch.service;

import com.dormmatch.dto.SurveySubmitRequest;
import com.dormmatch.entity.SurveyQuestion;

import java.util.List;
import java.util.Map;

public interface SurveyService {
    List<SurveyQuestion> getQuestions();
    Map<String, Object> getProgress(Long studentId);
    void saveDraft(Long studentId, List<SurveySubmitRequest.AnswerItem> answers);
    void submitSurvey(Long studentId, SurveySubmitRequest request);
    List<SurveySubmitRequest.AnswerItem> getDraft(Long studentId);
    boolean hasCompletedSurvey(Long studentId);
}
