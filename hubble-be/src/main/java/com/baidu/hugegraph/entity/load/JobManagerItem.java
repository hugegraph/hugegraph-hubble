package com.baidu.hugegraph.entity.load;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.util.SerializeUtil;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobManagerItem {

    @MergeProperty
    @JsonProperty("duration")
    @JsonSerialize(using = SerializeUtil.DurationSerializer.class)
    private Long duration;

    @MergeProperty
    @JsonProperty("total_size")
    @JsonSerialize(using = SerializeUtil.SizeSerializer.class)
    private long totalSize;
}
