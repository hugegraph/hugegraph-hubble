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

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baidu.hugegraph.entity.GraphConnection;
import com.baidu.hugegraph.mapper.GraphConnectionMapper;
import com.baidu.hugegraph.util.SQLUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

@Service
public class GraphConnectionService {

    @Autowired
    private GraphConnectionMapper mapper;

    public List<GraphConnection> listAll() {
        return this.mapper.selectList(null);
    }

    public IPage<GraphConnection> list(String content, long current,
                                       long pageSize) {
        IPage<GraphConnection> page = new Page<>(current, pageSize);
        if (!StringUtils.isEmpty(content)) {
            String value = SQLUtil.escapeLike(content);
            return this.mapper.selectByContentInPage(page, value);
        } else {
            QueryWrapper<GraphConnection> query = Wrappers.query();
            query.orderByDesc("create_time");
            return this.mapper.selectPage(page, query);
        }
    }

    public GraphConnection get(int id) {
        return this.mapper.selectById(id);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public int save(GraphConnection connection) {
        return this.mapper.insert(connection);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public int update(GraphConnection connection) {
        return this.mapper.updateById(connection);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public int remove(int id) {
        return this.mapper.deleteById(id);
    }
}
