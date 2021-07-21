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

package com.baidu.hugegraph.service.system;

import java.util.List;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.config.ClientConfiguration;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.login.LoginBody;
import com.baidu.hugegraph.entity.login.LoginResult;
import com.baidu.hugegraph.entity.user.UserEntity;
import com.baidu.hugegraph.mapper.UserResourcesMapper;
import com.baidu.hugegraph.service.user.UserService;
import com.baidu.hugegraph.structure.auth.Group;
import com.baidu.hugegraph.structure.auth.Login;
import com.baidu.hugegraph.structure.auth.TokenPayload;
import com.baidu.hugegraph.util.SessionUtil;

@Service
public class AuthService {

    @Resource(name = ClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient authClient;
    @Autowired
    private UserService userService;
    @Autowired
    private UserResourcesMapper userResourcesMapper;

    public LoginResult login(LoginBody loginEntity) {
        Login login = new Login();
        login.name(loginEntity.getName());
        login.password(loginEntity.getPassword());

        String token = this.authClient.auth().login(login).token();

        List<String> allowedMenus = null;
        try {
            this.authClient.setAuthContext(Constant.BEARER_TOKEN_PREFIX + token);
            TokenPayload payload = this.authClient.auth().verifyToken();

            List<Group> groups = this.userService.listGroupByUser(payload.userId());
            List<Integer> roleTypes = groups.stream()
                                            .filter(group -> group.tag() != null)
                                            .map(group -> (int) group.tag().code())
                                            .distinct()
                                            .collect(Collectors.toList());
            if (CollectionUtils.isNotEmpty(roleTypes)) {
                allowedMenus = userResourcesMapper.userResourcesList(roleTypes);
            }
        } finally {
            this.authClient.resetAuthContext();
        }

        return LoginResult.builder()
                          .token(token)
                          .allowedMenus(allowedMenus)
                          .build();
    }

    public void logout() {
        this.authClient.auth().logout();
    }

    public UserEntity getCurrentUser() {
        return SessionUtil.currentUser();
    }
}
