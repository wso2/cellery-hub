/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import CellDiagram from "./CellDiagram";
import Constants from "../../../utils/constants";
import React from "react";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        marginTop: theme.spacing(4),
        border: "1px dashed #eee"
    }
});

const DependencyDiagram = ({data, classes, history}) => {
    const getFQN = (nodeData) => `${nodeData.org}/${nodeData.name}:${nodeData.ver}`;
    const focusedNodeFQN = getFQN(data);
    const diagramData = {
        cells: [], // List of all the cell FQNs
        composites: [], // List of all the composite FQNs
        components: Object.keys(data.components).map((component) => (
            {
                parent: focusedNodeFQN,
                name: component
            }
        )),
        metaInfo: {}, // All the additional information of each Cell/Composite
        dependencyLinks: [] // The dependency links between Cells/Composites
    };

    // Adding the main Cell/Composite
    if (data.kind === Constants.Type.CELL) {
        diagramData.cells.push(focusedNodeFQN);
    } else if (data.kind === Constants.Type.COMPOSITE) {
        diagramData.composites.push(focusedNodeFQN);
    } else {
        throw Error(`Unknown type ${data.kind}`);
    }

    // Recursively extract dependencies (including transitive dependencies if available)
    const extractData = (node) => {
        const nodeFQN = getFQN(node);
        if (node.components) {
            Object.entries(node.components).forEach(([componentName, component]) => {
                const traverseDependencies = ([alias, dependency]) => {
                    const dependencyFQN = getFQN(dependency);

                    // Adding the dependency to the Cells/Composites list
                    if (dependency.kind === Constants.Type.CELL) {
                        if (!diagramData.cells.includes(dependencyFQN)) {
                            diagramData.cells.push(dependencyFQN);
                        }
                    } else if (dependency.kind === Constants.Type.COMPOSITE) {
                        if (!diagramData.composites.includes(dependencyFQN)) {
                            diagramData.composites.push(dependencyFQN);
                        }
                    } else {
                        throw Error(`Unknown type ${dependency.kind}`);
                    }

                    // Adding the link from the Cell to the dependency
                    diagramData.dependencyLinks.push({
                        alias: alias,
                        from: {
                            parent: nodeFQN,
                            component: componentName
                        },
                        to: dependencyFQN
                    });

                    if (dependency.components) {
                        Object.keys(dependency.components).forEach((component) => {
                            const matches = diagramData.components.find(
                                (datum) => datum.parent === dependencyFQN && datum.name === component);
                            if (!matches) {
                                diagramData.components.push({
                                    parent: dependencyFQN,
                                    name: component
                                });
                            }
                        });
                    }
                    extractData(dependency);
                };
                Object.entries(component.dependencies.cells).forEach(traverseDependencies);
                Object.entries(component.dependencies.composites).forEach(traverseDependencies);
            });
        }

        if (!diagramData.metaInfo.hasOwnProperty(nodeFQN)) {
            const nodeMetaInfo = {
                type: node.kind,
                ingresses: [],
                componentDependencyLinks: []
            };

            if (node.components) {
                Object.entries(node.components).forEach(([componentName, component]) => {
                    component.dependencies.components.forEach((dependentComponent) => {
                        nodeMetaInfo.componentDependencyLinks.push({
                            from: componentName,
                            to: dependentComponent
                        });
                    });
                    if (node.kind === Constants.Type.CELL && component.exposed) {
                        nodeMetaInfo.componentDependencyLinks.push({
                            from: "gateway",
                            to: componentName
                        });
                    }
                    if (component.ingressTypes) {
                        component.ingressTypes.forEach((ingressType) => {
                            if (!nodeMetaInfo.ingresses.includes(ingressType)) {
                                nodeMetaInfo.ingresses.push(ingressType);
                            }
                        });
                    }
                });
            }
            diagramData.metaInfo[nodeFQN] = nodeMetaInfo;
        }
    };
    extractData(data);

    return (
        <CellDiagram data={diagramData} focusedNode={`${data.org}/${data.name}:${data.ver}`}
            onClickNode={(nodeId) => {
                const nodeUrl = nodeId.replace(/:/g, "/");
                history.push(`/images/${nodeUrl}`);
            }}/>
    );
};

DependencyDiagram.propTypes = {
    data: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    focusedNode: PropTypes.string.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    })
};

export default withStyles(styles)(withRouter(DependencyDiagram));
