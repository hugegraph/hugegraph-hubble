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

package com.baidu.hugegraph.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

@Configuration
//@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket createRestfulApi() {
        Docket docket = new Docket(DocumentationType.SWAGGER_2);
        return docket.pathMapping("/")
                     .apiInfo(this.apiInfo())
                     .select()
                     .apis(RequestHandlerSelectors.basePackage(
                           "com.baidu.hugegraph.controller"))
                     .paths(PathSelectors.any())
                     .build();
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder().title("hugegraph-hubble restful api docs")
                                   .version("1.1")
                                   .description("API descriptions")
                                   .build();
    }
}
