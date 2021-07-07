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
import java.io.PrintWriter;
import java.util.Set;
import java.util.function.Supplier;

import javax.annotation.Resource;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.MediaType;

import org.apache.commons.lang.StringUtils;
import org.apache.http.HttpHeaders;
import org.springframework.web.bind.annotation.RequestMethod;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.common.Response;
import com.baidu.hugegraph.config.AuthClientConfiguration;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.util.JsonUtil;
import com.google.common.collect.ImmutableSet;

import lombok.extern.log4j.Log4j2;

@Log4j2
@WebFilter(filterName = "authFilter", urlPatterns = "/*")
public class AuthFilter implements Filter {

    private static final String BEARER_TOKEN_PREFIX = "Bearer ";

    private static final Set<String> WHITE_API = ImmutableSet.of(
            buildPath(RequestMethod.POST,
                      Constant.API_VERSION + "graph-connections/login")
    );

    @Resource(name = AuthClientConfiguration.AUTH_CLIENT_NAME)
    private HugeClient client;

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain filterChain)
                         throws IOException, ServletException {
        try {
            HttpServletRequest request = (HttpServletRequest) servletRequest;
            String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

            // Missed token and request uri not in white list
            if (StringUtils.isEmpty(authorization) && !isWhiteAPI(request)) {
                String msg = "Missed authorization token";
                writeResponse(servletResponse, () -> {
                    return Response.builder()
                                   .status(Constant.STATUS_BAD_REQUEST)
                                   .message(msg)
                                   .build();
                });
                return;
            }
            // Illegal token format
            if (StringUtils.isNotEmpty(authorization) &&
                !authorization.startsWith(BEARER_TOKEN_PREFIX)) {
                String msg = "Only HTTP Bearer authentication is supported";
                writeResponse(servletResponse, () -> {
                    return Response.builder()
                                   .status(Constant.STATUS_BAD_REQUEST)
                                   .message(msg)
                                   .build();
                });
                return;
            }

            this.client.setAuthContext(authorization);

            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            this.client.resetAuthContext();
        }
    }

    private static String buildPath(RequestMethod method, String path) {
        return buildPath(method.name(), path);
    }

    private static String buildPath(String method, String path) {
        return String.join(":", method, path);
    }

    private static boolean isWhiteAPI(HttpServletRequest request) {
        String url = request.getRequestURI();
        return WHITE_API.contains(buildPath(request.getMethod(), url));
    }

    private void writeResponse(ServletResponse servletResponse,
                               Supplier<Response> responseSupplier) {
        Response response = responseSupplier.get();

        servletResponse.setCharacterEncoding("UTF-8");
        servletResponse.setContentType(MediaType.APPLICATION_JSON);

        try (PrintWriter writer = servletResponse.getWriter()) {
            writer.print(JsonUtil.toJson(response));
        } catch (IOException e) {
            log.error("Response error", e);
        }
    }
}
