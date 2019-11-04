/*
 * Copyright 2017 HugeGraph Authors
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

package com.baidu.hugegraph.entity.load;

import java.util.Date;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.entity.enums.LoadStatus;
import com.baidu.hugegraph.util.SerializeUtil;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
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
@TableName("load_task")
public class LoadTask {

    @TableId(type = IdType.AUTO)
    @MergeProperty(useNew = false)
    @JsonProperty("id")
    private Integer id;

    @TableField(value = "conn_id")
    @MergeProperty
    @JsonProperty("conn_id")
    private Integer connId;

    @TableField("name")
    @MergeProperty
    @JsonProperty("name")
    private String name;

    @TableField("remark")
    @MergeProperty
    @JsonProperty("remark")
    private String remark;

    @TableField("total_file_size")
    @MergeProperty
    @JsonProperty("total_file_size")
    private Long totalFileSize;

    @TableField(value = "load_status")
    @MergeProperty
    @JsonProperty("status")
    private LoadStatus status;

    @TableField(value = "duration")
    @MergeProperty
    @JsonProperty("duration")
    @JsonSerialize(using = SerializeUtil.DurationSerializer.class)
    private Long duration;

    @TableField(value = "create_time")
    @MergeProperty(useNew = false)
    @JsonProperty("create_time")
    private Date createTime;
}
