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

import org.springframework.web.util.UriComponentsBuilder;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.GraphConnection;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.ServerException;
import com.baidu.hugegraph.rest.ClientException;
import com.baidu.hugegraph.structure.gremlin.Result;
import com.baidu.hugegraph.structure.gremlin.ResultSet;

public final class HugeClientUtil {

    public static HugeClient tryConnect(GraphConnection connection) {
        String graph = connection.getGraph();
        String host = connection.getHost();
        Integer port = connection.getPort();
        String username = connection.getUsername();
        String password = connection.getPassword();

        String url = UriComponentsBuilder.newInstance()
                                         .scheme("http")
                                         .host(host).port(port)
                                         .toUriString();
        HugeClient client;
        try {
            if (username != null) {
                client = new HugeClient(url, graph, username, password);
            } else {
                client = new HugeClient(url, graph);
            }
        } catch (IllegalStateException e) {
            String message = e.getMessage();
            if (message != null && message.startsWith("The version")) {
                throw new ExternalException("client-server.version.unmatched", e);
            }
            throw e;
        } catch (ServerException e) {
            String message = e.getMessage();
            if (message != null && message.startsWith("Authentication")) {
                throw new ExternalException(
                          "graph-connection.username-or-password.incorrect", e);
            }
            throw e;
        } catch (ClientException e) {
            Throwable cause = e.getCause();
            if (cause == null || cause.getMessage() == null) {
                throw e;
            }
            String message = cause.getMessage();
            if (message.contains("Connection refused")) {
                throw new ExternalException("service.unavailable", e, host, port);
            } else if (message.contains("java.net.UnknownHostException") ||
                       message.contains("Host name may not be null")) {
                throw new ExternalException("service.unknown-host", e, host);
            }
            throw e;
        }

        try {
            ResultSet rs = client.gremlin().gremlin("g.V().limit(1)").execute();
            rs.iterator().forEachRemaining(Result::getObject);
        } catch (ServerException e) {
            String message = e.message();
            if (message != null && message.contains("Could not rebind [g]")) {
                throw new ExternalException("graph-connection.graph.unexist", e,
                                            graph, host, port);
            }
            throw e;
        } catch (Exception e) {
            client.close();
            throw e;
        }
        return client;
    }
}
