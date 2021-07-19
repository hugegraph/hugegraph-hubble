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

package com.baidu.hugegraph.controller.project;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.entity.project.ProjectEntity;
import com.baidu.hugegraph.service.project.ProjectService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/project")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @PostMapping
    public ProjectEntity createProject(@RequestBody ProjectEntity project) {
        this.checkParamsValid(project, true);
        return this.projectService.createProject(project);
    }

    @PutMapping
    public ProjectEntity updateProject(@RequestBody ProjectEntity project) {
        this.checkParamsValid(project, false);
        return this.projectService.updateProject(project);
    }

    @DeleteMapping("{id}")
    public void deleteProject(@PathVariable("id") String projectId) {
        this.projectService.deleteProject(projectId);
    }

    @GetMapping("/list")
    public IPage<ProjectEntity> list(@RequestParam(value = "project_name",
                                                   required = false)
                                     String projectName,
                                     @RequestParam(name = "page_no",
                                                   required = false,
                                                   defaultValue = "1")
                                     int pageNo,
                                     @RequestParam(name = "page_size",
                                                   required = false,
                                                   defaultValue = "10")
                                     int pageSize) {
        return this.projectService.list(projectName, pageNo, pageSize);
    }

    private void checkParamsValid(ProjectEntity entity, boolean create) {
        Ex.check(StringUtils.isNotEmpty(entity.getName()),
                 "common.param.cannot-be-null-or-empty", "project_name");
        Ex.check(CollectionUtils.isNotEmpty(entity.getAdminUsers()),
                 "common.param.cannot-be-null-or-empty", "admin_users");
        Ex.check(CollectionUtils.isNotEmpty(entity.getOpUsers()),
                 "common.param.cannot-be-null-or-empty", "op_users");
        if (create) {
            Ex.check(entity.getId() == null,
                     "common.param.must-be-null", "id");
        } else {
            Ex.check(entity.getId() != null,
                     "common.param.cannot-be-null", "id");
        }
    }
}
