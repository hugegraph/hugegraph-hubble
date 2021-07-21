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

package com.baidu.hugegraph.entity.project;

import java.util.List;
import java.util.Set;

import com.baidu.hugegraph.entity.user.AuthElement;
import com.baidu.hugegraph.structure.auth.Project;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectEntity extends AuthElement {

    private static final long serialVersionUID = 6004765261545877970L;

    @JsonProperty("project_name")
    private String name;

    @JsonProperty("project_graphs")
    private Set<String> graphs;

    @JsonProperty("admin_users")
    private List<String> adminUsers;

    @JsonProperty("op_users")
    private List<String> opUsers;

    @JsonProperty("description")
    private String description;

    public static Project convertToProject(ProjectEntity entity) {
        Project project = new Project();
        project.description(entity.description);
        project.name(entity.name);
        project.graphs(entity.graphs);
        return project;
    }
}
