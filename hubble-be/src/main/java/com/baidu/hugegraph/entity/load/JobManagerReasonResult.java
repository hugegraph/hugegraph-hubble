package com.baidu.hugegraph.entity.load;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobManagerReasonResult {

    @MergeProperty
    @JsonProperty("task_id")
    private Integer taskId;

    @MergeProperty
    @JsonProperty("file_id")
    private Integer fileId;

    @MergeProperty
    @JsonProperty("file_name")
    private String fileName;

    @MergeProperty
    @JsonProperty("reason")
    private String reason;
}
