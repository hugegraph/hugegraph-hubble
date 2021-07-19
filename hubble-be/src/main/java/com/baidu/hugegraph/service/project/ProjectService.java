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

package com.baidu.hugegraph.service.project;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.config.ClientConfiguration;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.project.ProjectEntity;
import com.baidu.hugegraph.entity.user.UserEntity;
import com.baidu.hugegraph.service.user.UserService;
import com.baidu.hugegraph.structure.auth.Belong;
import com.baidu.hugegraph.structure.auth.Group;
import com.baidu.hugegraph.structure.auth.HugeGroupTag;
import com.baidu.hugegraph.structure.auth.Project;
import com.baidu.hugegraph.util.PageUtil;
import com.baidu.hugegraph.util.SessionUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.google.common.collect.Lists;

@Service
public class ProjectService {

    @Resource(name = ClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient authClient;

    @Resource(name = ClientConfiguration.ADMIN_CLIENT_NAME)
    private HugeClient adminClient;

    @Autowired
    private UserService userService;

    public ProjectEntity createProject(ProjectEntity entity) {
        Project project = ProjectEntity.convertToProject(entity);
        project = this.authClient.auth().createProject(project);

        createUserBelong(entity.getAdminUsers(), project.adminGroup());
        createUserBelong(entity.getOpUsers(), project.opGroup());

        entity.setId(project.id().toString());
        return entity;
    }

    public ProjectEntity updateProject(ProjectEntity entity) {
        Project current = this.authClient.auth().getProject(entity.getId());

        this.updateUserBelong(entity.getAdminUsers(), current.adminGroup());
        this.updateUserBelong(entity.getOpUsers(), current.opGroup());

        Project project = ProjectEntity.convertToProject(entity);
        this.authClient.auth().updateProject(project);

        return entity;
    }

    public void deleteProject(String projectId) {
        this.authClient.auth().deleteProject(projectId);
    }

    public IPage<ProjectEntity> list(String projectName, int pageNo,
                                     int pageSize) {
        List<Project> projects = this.adminClient.auth().listProjects();

        if (StringUtils.isNotEmpty(projectName)) {
            projects = projects.stream()
                               .filter(project -> {
                                   return project.name().contains(projectName);
                               })
                               .collect(Collectors.toList());
        }

        List<ProjectEntity> entities = projects.stream()
                                               .map(this::projectToEntity)
                                               .collect(Collectors.toList());
        UserEntity currentUser = SessionUtil.currentUser();
        List<Group> groups = this.userService
                                 .listGroupByUser(currentUser.getId());
        Set<HugeGroupTag> tags = groups.stream()
                                       .map(Group::tag)
                                       .filter(Objects::nonNull)
                                       .collect(Collectors.toSet());

        if (!tags.contains(HugeGroupTag.SUPER_ADMIN) &&
            !"admin".equals(currentUser.getUsername())) {
            entities = entities.stream().filter(entity -> {
                boolean adminHasCurrentUser =
                        entity.getAdminUsers()
                              .stream()
                              .anyMatch(user -> {
                                  return user.equals(currentUser.getId());
                              });
                boolean opHasCurrentUser =
                        entity.getOpUsers()
                              .stream()
                              .anyMatch(user -> {
                                  return user.equals(currentUser.getId());
                              });
                return adminHasCurrentUser || opHasCurrentUser;
            }).collect(Collectors.toList());
        }

        return PageUtil.page(entities, pageNo, pageSize);
    }

    private void createUserBelong(List<String> userIds, String groupId) {
        List<Belong> belongs = userIds.stream()
                                      .map(user -> {
                                           Belong belong = new Belong();
                                           belong.user(user);
                                           belong.group(groupId);
                                           return belong;
                                      })
                                      .collect(Collectors.toList());
        for (Belong belong : belongs) {
            this.authClient.auth().createBelong(belong);
        }
    }

    private void updateUserBelong(List<String> userIds, String groupId) {
        List<Belong> belongs = this.adminClient.auth()
                                   .listBelongsByGroup(groupId,
                                                       Constant.NO_LIMIT);

        Map<String, String> map =
                            belongs.stream()
                                   .collect(Collectors.toMap(belong -> {
                                               return (String) belong.user();
                                           }, belong -> {
                                               return (String) belong.id();
                                           }));
        Set<String> currentUsers = map.keySet();

        List<String> needCreateUsers = Lists.newArrayList(currentUsers);
        needCreateUsers.removeAll(userIds);

        List<String> needRemoveUsers = Lists.newArrayList(userIds);
        needRemoveUsers.removeAll(currentUsers);

        this.createUserBelong(needCreateUsers, groupId);
        needRemoveUsers.stream()
                       .map(map::get)
                       .forEach(belong -> {
                           this.authClient.auth().deleteBelong(belong);
                       });
    }

    private ProjectEntity projectToEntity(Project project) {
        ProjectEntity entity = new ProjectEntity();
        entity.setId(project.id().toString());
        entity.setDescription(project.description());
        entity.setCreate(project.createTime());
        entity.setCreator(project.creator());
        List<String> adminUsers = this.adminClient
                                      .auth()
                                      .listBelongsByGroup(
                                              project.adminGroup(),
                                              Constant.NO_LIMIT)
                                      .stream()
                                      .map(belong -> (String) belong.user())
                                      .collect(Collectors.toList());
        entity.setAdminUsers(adminUsers);
        List<String> opUsers = this.adminClient
                                   .auth()
                                   .listBelongsByGroup(
                                           project.opGroup(),
                                           Constant.NO_LIMIT)
                                   .stream()
                                   .map(belong -> {
                                       return (String) belong.user();
                                   })
                                   .collect(Collectors.toList());
        entity.setOpUsers(opUsers);
        return entity;
    }
}
