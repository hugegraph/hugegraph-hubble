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

import java.util.List;
import java.util.Set;

import com.google.common.collect.ImmutableSet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutePlan {

    private static final int LIMIT = 255;

    private static final Set<String> LIMITED_STEPS = ImmutableSet.of(
            "HugeGraphStep", "HugeVertexStep", "PathStep"
    );
    private static final Set<String> VERTEX_STEPS = ImmutableSet.of(
            "HugeGraphStep(vertex", "EdgeOtherVertexStep"
    );
    private static final Set<String> EDGE_STEPS = ImmutableSet.of(
            "HugeGraphStep(edge", "HugeVertexStep"
    );
    private static final Set<String> PATH_STEPS = ImmutableSet.of(
            "PathStep"
    );

    private List<String> finalSteps;

    public String lastFinalStep() {
        return this.finalSteps.get(this.finalSteps.size() - 1);
    }

    public String optimize(String gremlin) {
        String lastStep = this.lastFinalStep();
        boolean needLimited = LIMITED_STEPS.stream()
                                           .anyMatch(lastStep::startsWith);
        if (needLimited) {
            gremlin = gremlin + ".limit(" + LIMIT + ")";
        }
        return gremlin;
    }

    public GremlinResult.Type resultType() {
        String lastStep = this.lastFinalStep();
        if (VERTEX_STEPS.stream().anyMatch(lastStep::startsWith)) {
            return GremlinResult.Type.VERTEX;
        } else if (EDGE_STEPS.stream().anyMatch(lastStep::startsWith)) {
            return GremlinResult.Type.EDGE;
        } else if (PATH_STEPS.stream().anyMatch(lastStep::startsWith)) {
            return GremlinResult.Type.PATH;
        } else {
            return GremlinResult.Type.SINGLE;
        }
    }
}
