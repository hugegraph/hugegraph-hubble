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

package com.baidu.hugegraph.controller.user;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.entity.user.UserEntity;
import com.baidu.hugegraph.service.user.UserService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public UserEntity create(@RequestBody UserEntity user) {
        this.checkUser(user, true);
        return this.userService.createUser(user);
    }

    @PutMapping
    public UserEntity update(@RequestBody UserEntity user) {
        this.checkUser(user, false);
        return this.userService.updateUser(user);
    }

    @DeleteMapping
    public void delete(@RequestBody List<String> userIds) {
        this.userService.deleteUser(userIds);
    }

    @GetMapping
    public IPage<UserEntity> list(@RequestParam(value = "user_name",
                                                required = false)
                                  String userName,
                                  @RequestParam(name = "page_no",
                                                required = false,
                                                defaultValue = "1")
                                  int pageNo,
                                  @RequestParam(name = "page_size",
                                                required = false,
                                                defaultValue = "10")
                                  int pageSize) {
        return this.userService.list(userName, pageNo, pageSize);
    }

    private void checkUser(UserEntity entity, boolean create) {
        Ex.check(StringUtils.isNotEmpty(entity.getUsername()),
                 "common.param.cannot-be-null-or-empty", "user_name");
        Ex.check(StringUtils.isNotEmpty(entity.getPassword()),
                 "common.param.cannot-be-null-or-empty", "user_password");
        if (create) {
            Ex.check(entity.getId() == null,
                     "common.param.must-be-null", "id");
        } else {
            Ex.check(entity.getId() != null,
                     "common.param.cannot-be-null", "id");
        }
    }
}
