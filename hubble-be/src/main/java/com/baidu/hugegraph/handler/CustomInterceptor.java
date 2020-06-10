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

package com.baidu.hugegraph.handler;

import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.license.LicenseVerifier;
import com.baidu.hugegraph.service.license.LicenseService;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Component
public class CustomInterceptor extends HandlerInterceptorAdapter {

    @Autowired
    private LicenseService licenseService;

    private static final Pattern CHECK_API_PATTERN =
                         Pattern.compile(".*/graph-connections/\\d+/.+");

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        String url = request.getRequestURI();
        if (!CHECK_API_PATTERN.matcher(url).matches()) {
            return true;
        }

        String connIdValue = StringUtils.substringBetween(
                             url, "/graph-connections/", "/");
        if (StringUtils.isEmpty(connIdValue)) {
            throw new InternalException("Not found conn id in url");
        }

        int connId = Integer.parseInt(connIdValue);
        // Check graph connection valid
        this.licenseService.checkGraphStatus(connId);
        LicenseVerifier.instance().verifyIfNeeded();
        return true;
    }
}
