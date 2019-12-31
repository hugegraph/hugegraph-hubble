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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.baidu.hugegraph.config.HugeConfig;
import com.baidu.hugegraph.license.LicenseVerifier;

@Component
public class CustomApplicationRunner implements ApplicationRunner {

    @Autowired
    private HugeConfig config;

    @Override
    public void run(ApplicationArguments args) throws Exception {
//        this.installLicense(this.config, "9662b261c388fc5923ace0ebe2a34b02");
    }

    private void installLicense(HugeConfig config, String md5) {
        LicenseVerifier.instance().install(config, md5);
    }
}
