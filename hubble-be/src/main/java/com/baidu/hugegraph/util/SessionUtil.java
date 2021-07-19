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

package com.baidu.hugegraph.util;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.user.UserEntity;
import com.baidu.hugegraph.structure.auth.TokenPayload;
import com.baidu.hugegraph.structure.auth.User;

public class SessionUtil {

    public static HugeClient authClient;
    public static HugeClient adminClient;
    private static final ThreadLocal<UserEntity> userLocal =
                                                 new ThreadLocal<>();

    public static UserEntity currentUser() {
        if (userLocal.get() != null) {
            return userLocal.get();
        }
        TokenPayload payload = authClient.auth().verifyToken();
        User user = authClient.auth().getUser(payload.userId());

        UserEntity userEntity = UserEntity.convertFromUser(user);
        userLocal.set(userEntity);
        return userEntity;
    }

    public static void reset() {
        userLocal.remove();
    }
}
