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

package com.baidu.hugegraph.entity;

import java.time.LocalDateTime;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.common.Identifiable;
import com.baidu.hugegraph.common.Mergeable;
import com.baidu.hugegraph.entity.enums.ExecuteStatus;
import com.baidu.hugegraph.entity.enums.ExecuteType;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("execute_history")
public class ExecuteHistory implements Identifiable, Mergeable {

    @TableId(type = IdType.AUTO)
    @MergeProperty(useNew = false)
    private Integer id;
    @TableField(value = "execute_type")
    @MergeProperty
    private ExecuteType type;
    @MergeProperty
    private String content;
    @TableField(value = "execute_status")
    @MergeProperty
    private ExecuteStatus status;
    @MergeProperty
    private Long duration;
    @MergeProperty(useNew = false)
    private LocalDateTime createTime;
}
