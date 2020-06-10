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

import java.util.Date;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.common.Identifiable;
import com.baidu.hugegraph.common.Mergeable;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName(value = "graph_connection", autoResultMap = true)
public class GraphConnection implements Identifiable, Mergeable {

    @TableId(type = IdType.AUTO)
    @MergeProperty(useNew = false)
    @JsonProperty("id")
    private Integer id;

    @MergeProperty
    @JsonProperty("name")
    private String name;

    @MergeProperty
    @JsonProperty("graph")
    private String graph;

    @MergeProperty
    @JsonProperty("host")
    private String host;

    @MergeProperty
    @JsonProperty("port")
    private Integer port;

    @MergeProperty
    @JsonProperty("timeout")
    private Integer timeout;

    @MergeProperty
    @JsonProperty("username")
    private String username;

    @MergeProperty
    @JsonProperty(value = "password", access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @MergeProperty
    @JsonProperty("enabled")
    private Boolean enabled;

    @MergeProperty
    @JsonProperty(value = "disable_reason")
    private String disableReason;

    @MergeProperty(useNew = false)
    @JsonProperty("create_time")
    private Date createTime;
}
