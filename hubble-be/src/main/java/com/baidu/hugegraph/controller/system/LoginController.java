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

package com.baidu.hugegraph.controller.system;

import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.controller.BaseController;
import com.baidu.hugegraph.entity.login.LoginBody;
import com.baidu.hugegraph.entity.login.LoginResult;
import com.baidu.hugegraph.entity.user.HubbleUser;
import com.baidu.hugegraph.service.system.AuthService;
import com.baidu.hugegraph.util.E;

@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/login")
public class LoginController extends BaseController {

    @Autowired
    private AuthService authService;

    @PostMapping
    public LoginResult login(@RequestBody LoginBody loginBody) {
        return this.authService.login(loginBody);
    }

    @DeleteMapping
    public void logout() {
        this.authService.logout();
    }

    @GetMapping("/user")
    public HubbleUser currentUser(@RequestHeader(HttpHeaders.AUTHORIZATION)
                                  String token) {
        E.checkArgumentNotNull(token,
                               "Request header Authorization must not be null");
        return this.authService.getCurrentUser();
    }
}
