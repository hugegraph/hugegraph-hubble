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

package com.baidu.hugegraph.filter;

import java.io.IOException;

import javax.annotation.Resource;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.apache.http.HttpHeaders;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.config.AuthClientConfiguration;

import lombok.extern.log4j.Log4j2;

@Log4j2
@WebFilter(filterName = "authFilter", urlPatterns = "/*")
public class AuthFilter implements Filter {

    @Resource(name = AuthClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient client;

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain filterChain)
                         throws IOException, ServletException {
        try {
            String authorization = ((HttpServletRequest) servletRequest)
                                   .getHeader(HttpHeaders.AUTHORIZATION);
            if (StringUtils.isNotEmpty(authorization)) {
                this.client.setAuthContext(authorization);
            }

            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            this.client.resetAuthContext();
        }
    }
}
