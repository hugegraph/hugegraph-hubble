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

package com.baidu.hugegraph.advisor;

import java.util.Locale;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.LocaleUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.RequestContextUtils;
import org.springframework.web.util.WebUtils;

import com.baidu.hugegraph.entity.UserInfo;
import com.baidu.hugegraph.service.UserInfoService;

@Component
public class MessageSourceHandler {

    @Autowired
    private MessageSource messageSource;
    @Autowired
    private HttpServletRequest request;
    @Autowired
    private UserInfoService service;

    public String getMessage(String message, String[] args) {
        return this.messageSource.getMessage(message, args, this.getLocale());
    }

    private Locale getLocale() {
        UserInfo userInfo = this.getUserInfo();
        Locale locale;
        if (userInfo != null && userInfo.getLocale() != null) {
            locale = LocaleUtils.toLocale(userInfo.getLocale());
        } else if (this.request.getLocale() != null) {
            locale = RequestContextUtils.getLocale(this.request);
        } else {
            locale = LocaleContextHolder.getLocale();
        }
        System.out.println("locale: " + locale);
        return locale;
    }

    private UserInfo getUserInfo() {
        Cookie cookie = WebUtils.getCookie(this.request, "user");
        if (cookie == null || cookie.getValue() == null) {
            return null;
        }
//        String json = URLUtil.decode(cookie.getValue());
//        return UserInfo.read(json);
        String username = cookie.getValue();
        return this.service.getByName(username);
    }
}
