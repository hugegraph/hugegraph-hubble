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

import java.util.Map;

import javax.annotation.Resource;

import org.springframework.stereotype.Service;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.user.HubbleUser;
import com.baidu.hugegraph.config.AuthClientConfiguration;
import com.baidu.hugegraph.structure.auth.User;

@Service
public class TokenService {

    private static final String USER_NAME = "user_name";
    private static final String USER_ID = "user_id";

    @Resource(name = AuthClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient authClient;

    public HubbleUser getUser() {
        Map<String, Object> payload = this.authClient.auth().verifyToken();
        String userId = (String) payload.get(USER_ID);
        User user = this.authClient.auth().getUser(userId);

        // TODO Set user auth info
        return HubbleUser.builder()
                         .username(user.name())
                         .password(user.password())
                         .phone(user.phone())
                         .email(user.email())
                         .build();
    }
}
