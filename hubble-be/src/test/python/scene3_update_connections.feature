# language: en
Feature: update hugeGraph's connections

  @lxb
  Scenario Outline: update connections -- <scene>
    When update connections -- request_host: 127.0.0.1:8088
    Given update connections
    Then update connections -- <ass>
    Examples:
      | scene       | ass            |
      | 更新name     | {"status":200, "message":"None"} |



