# language: en
Feature: add hugeGraph's connections

  @lxb
  Scenario Outline: add connections -- <scene>
    When add connections -- request_host: 127.0.0.1:8088
    Given add connections -- param: <param>
    Then add connections -- compare_assert: <ass>
    Examples:
      | scene                   | param                                                                                                                                                            | ass              |
      | user不存在                 | { "name": "hugegraph3_abnormal","graph" : "hugegraph3","host" : "127.0.0.1","port" : 8081,"password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}                     | {"status":400, "message":""} |
      | user为空                  | { "name": "hugegraph3_abnormal","graph" : "hugegraph3","host" : "127.0.0.1","port" : 8081,"username":"","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}       | {"status":400, "message":""} |
      | password不存在             | { "name": "hugegraph3_abnormal","graph" : "hugegraph3","host" : "127.0.0.1","port" : 8081,"username":"hugegraph3"}                                               | {"status":400, "message":""} |
      | password为空              | { "name": "hugegraph3_abnormal","graph" : "hugegraph3","host" : "127.0.0.1","port" : 8081,"username":"hugegraph3","password":""}                                 | {"status":400, "message":""} |
      | name不存在                 | { "graph" : "hugegraph1","host" : "127.0.0.1","port" : 8080}                                                                                                     | {"status":400, "message":"参数 name 不能为 null 或空"} |
      | name为空                  | { "name": "","graph" : "hugegraph1","host" : "127.0.0.1","port" : 8080}                                                                                          | {"status":400, "message":"参数 name 不能为 null 或空"} |
      | graph不存在                | { "name": "hugegraph1_abnormal","host" : "127.0.0.1","port" : 8080}                                                                                              | {"status":400, "message":"参数 graph 不能为 null 或空"} |
      | graph为空                 | { "name": "hugegraph1_abnormal","graph" : "","host" : "127.0.0.1","port" : 8080}                                                                                 | {"status":400, "message":"参数 graph 不能为 null 或空"} |
      | host不存在                 | { "name": "hugegraph1_abnormal","graph" : "hugegraph1","port" : 8080 }                                                                                           | {"status":400, "message":"参数 host 不能为 null 或空"} |
      | host为空                  | { "name": "hugegraph1_abnormal","graph" : "hugegraph1","host" : "","port" : 8080 }                                                                               | {"status":400, "message":"参数 host 不能为 null 或空"} |
      | port不存在                 | { "name": "hugegraph1_abnormal","graph" : "hugegraph1","host" : "127.0.0.1"}                                                                                     | {"status":400, "message":"参数 port 不能为 null"} |
      | port为空                  | { "name": "hugegraph1_abnormal","graph" : "hugegraph1","host" : "127.0.0.1","port" : ""}                                                                         | {"status":400, "message":"参数 port 不能为 null"} |
      ### set dataset
      | 正例(user不存在,password不存在) | { "name": "hugegraph1_ip","graph" : "hugegraph1","host" : "127.0.0.1","port" : 8080}                                                                             | {"status":200,"message":"None"} |
      | 正例(user不存在,password不存在) | { "name": "hugegraph1_host","graph" : "hugegraph1","host" : "localhost","port" : 8080}                                                                           | {"status":200,"message":"None"} |
      | 正例(user不存在,password不存在) | { "name": "hugegraph2_ip","graph" : "hugegraph2","host" : "127.0.0.1","port" : 8080}                                                                             | {"status":200,"message":"None"} |
      | 正例(user不存在,password不存在) | { "name": "hugegraph2_host","graph" : "hugegraph2","host" : "localhost","port" : 8080}                                                                           | {"status":200,"message":"None"} |
      | 正例(user存在,password存在)   | { "name": "hugegraph3_ip","graph" : "hugegraph3","host" : "127.0.0.1","port" : 8081,"username":"hugegraph3","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}   | {"status":200,"message":"None"} |
      | 正例(user存在,password存在)   | { "name": "hugegraph3_host","graph" : "hugegraph3","host" : "localhost","port" : 8081,"username":"hugegraph3","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"} | {"status":200,"message":"None"} |







