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

package com.baidu.hugegraph.controller;

import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.entity.AdjacentQuery;
import com.baidu.hugegraph.entity.ExecutePlan;
import com.baidu.hugegraph.entity.GremlinQuery;
import com.baidu.hugegraph.entity.GremlinResult;
import com.baidu.hugegraph.service.GremlinQueryService;
import com.baidu.hugegraph.util.Ex;
import com.google.common.collect.ImmutableSet;

@RestController
@RequestMapping("gremlin-query")
public class GremlinQueryController extends BaseController {

    private static final Set<String> TERM_OPERATORS = ImmutableSet.of(
            "eq", "gt", "gte", "lt", "lte"
    );

    @Autowired
    private GremlinQueryService service;

    @PostMapping
    public GremlinResult execute(@RequestBody GremlinQuery query) {
        this.checkParamsValid(query);
        // Get execute plan used for pre handle
        ExecutePlan plan = this.service.explain(query);
        String gremlin = plan.optimize(query.getContent());
        query.setContent(gremlin);
        return this.service.executeQuery(query, plan);
    }

    @PutMapping
    public GremlinResult expand(@RequestBody AdjacentQuery query) {
        this.checkParamsValid(query);
        return this.service.expandVertex(query);
    }

    private void checkParamsValid(GremlinQuery query) {
        Ex.check(!StringUtils.isEmpty(query.getContent()),
                 "Gremlin sentence can't be null or empty");
    }

    private void checkParamsValid(AdjacentQuery query) {
        Ex.check(query.getVertexId() != null, "Vertex id can't be null");
        if (query.getTerms() != null && !query.getTerms().isEmpty()) {
            for (AdjacentQuery.Term term : query.getTerms()) {
                Ex.check(!StringUtils.isEmpty(term.getKey()),
                         "term.key can't be null or empty");
                Ex.check(!StringUtils.isEmpty(term.getOperator()),
                         "term.operator can't be null or empty");
                Ex.check(TERM_OPERATORS.contains(term.getOperator()),
                         "term.operator should be one of %s", TERM_OPERATORS);
                Ex.check(term.getValue() != null,
                         "term.value can't be null or empty");
            }
        }
    }
}
