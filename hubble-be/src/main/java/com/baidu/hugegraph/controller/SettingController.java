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

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.entity.UserInfo;
import com.baidu.hugegraph.service.UserInfoService;
import com.baidu.hugegraph.util.E;

@RestController
@RequestMapping("setting")
public class SettingController {

    @Autowired
    private UserInfoService service;

    @GetMapping("common")
    public UserInfo common(@RequestParam(value = "lang",
                                         defaultValue = "en_US")
                           String lang,
                           HttpServletResponse response) {
        E.checkArgument(lang != null, "The param lang can't be null");
        E.checkArgument(Constant.LANGUAGES.contains(lang),
                        "The acceptable languages are %s, but got %s",
                        Constant.LANGUAGES, lang);

        UserInfo userInfo = UserInfo.builder()
                                    .username("anonymous")
                                    .locale(lang)
                                    .build();
        int rows = this.service.update(userInfo);
        if (rows != 1) {
            throw new RuntimeException("Save failed");
        }
        Cookie cookie = new Cookie("user", userInfo.getUsername());
        response.addCookie(cookie);
        return userInfo;
    }
}
