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

package com.baidu.hugegraph.entity.schema;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.ImmutableList;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
public class EdgeLabelStyle extends SchemaStyle {

    @JsonProperty("color")
    private String color;

    @JsonProperty("with_arrow")
    private Boolean withArrow;

    @JsonProperty("thickness")
    private Thickness thickness = Thickness.NORMAL;

    @JsonProperty("display_fields")
    private List<String> displayFields;

    @JsonProperty("join_symbols")
    private List<String> joinSymbols;

    @JsonCreator
    public EdgeLabelStyle(@JsonProperty("color") String color,
                          @JsonProperty("with_arrow") Boolean withArrow,
                          @JsonProperty("thickness") Thickness thickness,
                          @JsonProperty("display_fields")
                          List<String> displayFields,
                          @JsonProperty("join_symbols")
                          List<String> joinSymbols) {
        this.color = !StringUtils.isEmpty(color) ? color : "#5C73E6";
        this.withArrow = withArrow != null ? withArrow : true;
        this.thickness = thickness != null ? thickness : Thickness.NORMAL;
        this.displayFields = !CollectionUtils.isEmpty(displayFields) ?
                             displayFields : ImmutableList.of("~id");
        this.joinSymbols = !CollectionUtils.isEmpty(joinSymbols) ?
                           joinSymbols : ImmutableList.of("-");
    }

    public enum Thickness {

        THICK,

        NORMAL,

        FINE
    }
}
