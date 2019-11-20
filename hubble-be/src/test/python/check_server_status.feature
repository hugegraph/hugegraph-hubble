# language: en
Feature: check hugegraph-hubble server health status

  Scenario Outline: check hugegraph-hubble server health status
    When  scene:<scene>  url:<url>
    Then  response:<response>
    Examples:
      | scene                      | url            | response        |
      | check server health status | localhost:8088 | {"status":"UP"} |
