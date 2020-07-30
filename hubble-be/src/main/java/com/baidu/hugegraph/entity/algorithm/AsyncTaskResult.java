package com.baidu.hugegraph.entity.algorithm;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncTaskResult {

    @MergeProperty
    @JsonProperty("id")
    private Integer id;

    @MergeProperty
    @JsonProperty("task_name")
    private String taskName;

    @MergeProperty
    @JsonProperty("task_progress")
    private Long taskProgress;

    @MergeProperty
    @JsonProperty("task_status")
    private String taskStatus;

    @MergeProperty
    @JsonProperty("task_create")
    private Long taskCreate;

    @MergeProperty
    @JsonProperty("task_update")
    private Long taskUpdate;

    @MergeProperty
    @JsonProperty("task_type")
    private String taskType;

    @MergeProperty
    @JsonProperty("task_result")
    private String taskResult;

    @MergeProperty
    @JsonProperty("task_retries")
    private Integer taskRetries;

    @MergeProperty
    @JsonProperty("task_callable")
    private String taskCallable;

    @MergeProperty
    @JsonProperty("task_input")
    private String taskInput;
}
