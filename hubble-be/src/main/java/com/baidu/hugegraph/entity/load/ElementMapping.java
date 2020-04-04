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

import java.util.Map;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.common.Mergeable;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class ElementMapping implements Mergeable {

    @MergeProperty(useNew = false)
    @JsonProperty("id")
    private String id;

    @MergeProperty
    @JsonProperty("label")
    private String label;

    @MergeProperty
    @JsonProperty("field_mapping")
    private Map<String, String> mappingFields;

    @MergeProperty
    @JsonProperty("value_mapping")
    private Map<String, Map<String, Object>> mappingValues;

    @MergeProperty
    @JsonProperty("null_values")
    private NullValues nullValues;
}
