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

package com.baidu.hugegraph.service;

import java.util.concurrent.ConcurrentHashMap;

import javax.annotation.PreDestroy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.GraphConnection;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.util.HugeClientUtil;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public final class HugeClientPoolService
             extends ConcurrentHashMap<Integer, HugeClient> {

    @Autowired
    private GraphConnectionService connService;

    @PreDestroy
    public void destroy() {
        log.info("Destroy HugeClient pool");
        for (HugeClient client : this.values()) {
            client.close();
        }
    }

    public void put(GraphConnection connection, HugeClient client) {
        super.put(connection.getId(), client);
    }

    public synchronized HugeClient getOrCreate(Integer id) {
        HugeClient client = super.get(id);
        if (client != null) {
            return client;
        }
        GraphConnection connection = this.connService.get(id);
        if (connection == null) {
            throw new ExternalException("graph-connection.get.failed", id);
        }
        client = HugeClientUtil.tryConnect(connection);
        this.put(id, client);
        return client;
    }

    public void remove(GraphConnection connection) {
        HugeClient client = super.remove(connection.getId());
        if (client == null) {
            return;
        }
        client.close();
    }
}
