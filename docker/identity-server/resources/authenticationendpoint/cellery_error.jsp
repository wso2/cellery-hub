<%--
  ~ Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
  ~
  ~ WSO2 Inc. licenses this file to you under the Apache License,
  ~ Version 2.0 (the "License"); you may not use this file except
  ~ in compliance with the License.
  ~ You may obtain a copy of the License at
  ~
  ~ http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
  --%>

<%@ page import="org.owasp.encoder.Encode" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@include file="localize.jsp" %>

<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%=AuthenticationEndpointUtil.i18n(resourceBundle, "business.name")%></title>

    <link rel="icon" href="images/favicon.png" type="image/x-icon"/>
    <link href="libs/bootstrap_3.3.5/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/Roboto.css" rel="stylesheet">
    <link href="css/custom-common.css" rel="stylesheet">


    <!--[if lt IE 9]>
    <script src="js/html5shiv.min.js"></script>
    <script src="js/respond.min.js"></script>
    <![endif]-->
</head>

<body class="error-page">

<!-- header -->
<header class="header header-default">
    <div class="container-fluid">
        <div class="pull-left brand float-remove-xs text-center-xs">
            <a href="http://cellery.io/" target="_blank" class="header-name">
                <img src="images/logo-inverse.svg" alt="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "business.name")%>" title="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "business.name")%>" class="logo">
            </a>
        </div>
    </div>
</header>

<!-- page content -->
<div class="row">
    <div class="col-md-12">
        <!-- content -->
        <div class="container col-xs-10 col-sm-10 col-md-8 col-lg-6 col-centered">
            <div class="padding-top-double">
                <img src="images/cellery-error.jpg" class="error-img center-block padding-top-double">
            </div>
            <h1 class="error-text center-block"><%=AuthenticationEndpointUtil.i18n(resourceBundle, "something.went.wrong")%></h1>
            <h1><small class="error-text-secondary center-block padding-bottom-double"><%=AuthenticationEndpointUtil.i18n(resourceBundle, "sign.in.again")%></small></h1>
            <div class="padding-top-double padding-bottom-double">
                <div class="font-medium">
                    <button class="btn btn-default btn-lg goto-hub-btn center-block" onclick="location.href='<%=AuthenticationEndpointUtil.i18n(resourceBundle, "hub.homepage")%>'">
                        <%=AuthenticationEndpointUtil.i18n(resourceBundle, "go.to.hub")%></button>
                </div>
            </div>
        </div>
        <!-- /content -->
    </div>
</div>

<!-- footer -->
<footer class="footer">
    <div class="container-fluid">
        <p><%=AuthenticationEndpointUtil.i18n(resourceBundle, "wso2.identity.server")%> | &copy;
            <script>document.write(new Date().getFullYear());</script>
            <a href="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "business.homepage")%>" target="_blank"><i class="icon fw fw-wso2"></i>
                <%=AuthenticationEndpointUtil.i18n(resourceBundle, "inc")%>
            </a>. <%=AuthenticationEndpointUtil.i18n(resourceBundle, "all.rights.reserved")%>
        </p>
    </div>
</footer>

<script src="libs/jquery_1.11.3/jquery-1.11.3.js"></script>
<script src="libs/bootstrap_3.3.5/js/bootstrap.min.js"></script>

<script type="text/javascript" src="js/u2f-api.js"></script>

</body>
</html>
