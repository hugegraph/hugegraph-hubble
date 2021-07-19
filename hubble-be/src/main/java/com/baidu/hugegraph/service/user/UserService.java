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

package com.baidu.hugegraph.service.user;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.config.ClientConfiguration;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.user.UserEntity;
import com.baidu.hugegraph.structure.auth.Belong;
import com.baidu.hugegraph.structure.auth.Group;
import com.baidu.hugegraph.structure.auth.HugeGroupTag;
import com.baidu.hugegraph.structure.auth.User;
import com.baidu.hugegraph.structure.schema.VertexLabel;
import com.baidu.hugegraph.util.E;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.common.collect.Lists;

@Service
public class UserService {

    @Resource(name = ClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient authClient;
    @Resource(name = ClientConfiguration.ADMIN_CLIENT_NAME)
    private HugeClient adminClient;

    public UserEntity createUser(UserEntity userEntity) {
        User user = UserEntity.convertToUser(userEntity);
        user = this.authClient.auth().createUser(user);

        try {
            List<HugeGroupTag> platformRoles = userEntity.getPlatformRoles();
            if (CollectionUtils.isNotEmpty(platformRoles)) {
                for (HugeGroupTag tag : platformRoles) {
                    E.checkArgument(HugeGroupTag.SUPER_ADMIN.equals(tag) ||
                                    HugeGroupTag.OP_SUPER_ADMIN.equals(tag),
                                    "The parameter platformRoles must " +
                                    "be in (%s, %s)",
                                    HugeGroupTag.SUPER_ADMIN,
                                    HugeGroupTag.OP_SUPER_ADMIN);

                    Belong belong = new Belong();
                    belong.user(user);
                    belong.group(groupByName(tag.name()));
                    this.authClient.auth().createBelong(belong);
                }
            }
        } catch (Exception e) {
            this.authClient.auth().deleteUser(user.id());
            throw e;
        }

        userEntity.setId(user.id().toString());
        return userEntity;
    }

    public UserEntity updateUser(UserEntity userEntity) {
        User user = UserEntity.convertToUser(userEntity);
        user = this.authClient.auth().updateUser(user);

        List<HugeGroupTag> platformRoles = userEntity.getPlatformRoles();
        platformRoles = platformRoles == null ? new ArrayList<>() :
                        platformRoles;

        List<Group> groups = this.listGroupByUser(user.id().toString());
        List<HugeGroupTag> userAdminTags =
                           groups.stream()
                                 .map(Group::tag)
                                 .filter(tag -> {
                                     return HugeGroupTag.SUPER_ADMIN.equals(tag) ||
                                            HugeGroupTag.OP_SUPER_ADMIN.equals(tag);
                                 })
                                 .collect(Collectors.toList());

        List<HugeGroupTag> needCreateBelongTags =
                           new ArrayList<>(platformRoles);
        needCreateBelongTags.removeAll(userAdminTags);
        List<HugeGroupTag> needRemoveBelongTags =
                           new ArrayList<>(userAdminTags);
        needRemoveBelongTags.removeAll(platformRoles);

        for (HugeGroupTag tag : needCreateBelongTags) {
            Belong belong = new Belong();
            belong.group(groupByName(tag.name()));
            belong.user(user);
            this.authClient.auth().createBelong(belong);
        }

        Map<Object, Object> map = this.authClient
                                      .auth()
                                      .listBelongsByUser(user,
                                                         Constant.NO_LIMIT)
                                      .stream()
                                      .collect(Collectors.toMap(Belong::group,
                                                                Belong::id));
        Set<HugeGroupTag> needRemoveTagSet =
                          new HashSet<>(needRemoveBelongTags);

        List<Object> needRemoveBelongs =
                     needRemoveTagSet.stream()
                                     .map(tag -> {
                                         String groupId =
                                                this.groupIdByName(tag.name());
                                         return map.get(groupId);
                                     })
                                     .filter(Objects::nonNull)
                                     .collect(Collectors.toList());

        for (Object belongId : needRemoveBelongs) {
            this.authClient.auth().deleteBelong(belongId);
        }

        return userEntity;
    }

    public void deleteUser(List<String> userIds) {
        // TODO batch delete?
        for (String userId : userIds) {
            this.authClient.auth().deleteUser(userId);
        }
    }

    public IPage<UserEntity> list(String userName, int pageNo, int pageSize) {
        List<User> users = this.authClient.auth().listUsers(Constant.NO_LIMIT);
        if (StringUtils.isNotEmpty(userName)) {
            users = users.stream()
                         .filter(user -> user.name().contains(userName))
                         .collect(Collectors.toList());
        }

        IPage<User> page = PageUtil.page(users, pageNo, pageSize);
        List<UserEntity> userEntities = page.getRecords()
                                             .stream()
                                             .map(UserEntity::convertFromUser)
                                             .collect(Collectors.toList());
        // TODO batch query?
        for (UserEntity user : userEntities) {
            List<Group> groups = this.listGroupByUser(user.getId());
            user.setGroups(groups);
        }

        Page<UserEntity> result = new Page<>(page.getCurrent(), page.getSize(),
                                             page.getTotal(), true);
        result.setRecords(userEntities);
        result.setPages(page.getPages());
        return result;
    }

    public List<Group> listGroupByUser(String userId) {
        List<Belong> belongs = this.adminClient.auth().listBelongsByUser(
                                                        userId,
                                                        Constant.NO_LIMIT);
        List<Group> groups = null;
        if (CollectionUtils.isNotEmpty(belongs)) {
            List<Object> groupIds = belongs.stream().map(Belong::group)
                                           .collect(Collectors.toList());
            groups = this.adminClient.auth().listGroups(groupIds);
        }

        return groups == null ? Lists.newArrayList() : groups;
    }

    private String groupIdByName(String name) {
        VertexLabel groupLabel = this.authClient.schema()
                                                .getVertexLabel(Group.label());
        return StringUtils.join(groupLabel.id(), ":", name);
    }

    private Group groupByName(String name) {
        return this.authClient.auth().getGroup(this.groupIdByName(name));
    }
}
