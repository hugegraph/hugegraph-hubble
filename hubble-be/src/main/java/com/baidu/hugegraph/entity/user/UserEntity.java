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

package com.baidu.hugegraph.entity.user;

import java.util.List;

import com.baidu.hugegraph.structure.auth.Group;
import com.baidu.hugegraph.structure.auth.HugeGroupTag;
import com.baidu.hugegraph.structure.auth.User;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends AuthElement {

    private static final long serialVersionUID = 3121398441504040737L;

    @JsonProperty("user_name")
    private String username;

    @JsonProperty("user_password")
    private String password;

    @JsonProperty("user_phone")
    private String phone;

    @JsonProperty("user_email")
    private String email;

    @JsonProperty("user_description")
    private String description;

    @JsonProperty("user_groups")
    private List<Group> groups;

    @JsonProperty("platform_role")
    private List<HugeGroupTag> platformRoles;

    public static User convertToUser(UserEntity userEntity) {
        User user = new User();
        user.name(userEntity.username);
        user.password(userEntity.password);
        user.phone(userEntity.phone);
        user.email(userEntity.email);
        user.description(userEntity.description);
        user.id(userEntity.id);
        return user;
    }
    
    public static UserEntity convertFromUser(User user) {
        UserEntity userEntity = new UserEntity();
        userEntity.username = user.name();
        userEntity.password = user.password();
        userEntity.phone = user.phone();
        userEntity.email = user.email();
        userEntity.description = user.description();
        userEntity.id = user.id().toString();
        return userEntity;
    }
}
