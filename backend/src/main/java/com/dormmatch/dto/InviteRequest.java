package com.dormmatch.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class InviteRequest {
    private Long targetId;
    @Size(max = 200, message = "附言不超过200字")
    private String message;
}
