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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package io.cellery.hub.identity.extension;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.identity.base.IdentityException;
import org.wso2.carbon.identity.base.IdentityRuntimeException;

import java.sql.Connection;
import java.sql.SQLException;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

/**
 * DB persistance manager for cellery hub database.
 */
public class DBPersistanceManager {

    private static Log log = LogFactory.getLog(DBPersistanceManager.class);
    private static volatile DBPersistanceManager instance;
    private DataSource dataSource;
    // This property refers to Active transaction state of postgresql db
    private static final String PG_ACTIVE_SQL_TRANSACTION_STATE = "25001";
    private static final String POSTGRESQL_DATABASE = "PostgreSQL";

    private DBPersistanceManager() {

        initDataSource();
    }

    /**
     * Get an instance of the JDBCPersistenceManager. It implements a lazy
     * initialization with double
     * checked locking, because it is initialized first by identity.core module
     * during the start up.
     *
     * @return JDBCPersistenceManager instance
     * @throws IdentityException Error when reading the data source configurations
     */
    public static DBPersistanceManager getInstance() {

        if (instance == null) {
            synchronized (DBPersistanceManager.class) {
                if (instance == null) {
                    instance = new DBPersistanceManager();
                }
            }
        }
        return instance;
    }

    private void initDataSource() {

        try {

            String dataSourceName = "jdbc/CELLERY_HUB";
            Context ctx = new InitialContext();
            dataSource = (DataSource) ctx.lookup(dataSourceName);

        } catch (NamingException e) {
            String errorMsg = "Error when looking up the Identity Data Source.";
            throw IdentityRuntimeException.error(errorMsg, e);
        }
    }

    /**
     * Returns an database connection for Identity data source.
     *
     * @return Database connection
     * @throws IdentityException Exception occurred when getting the data source.
     */
    public Connection getDBConnection() throws IdentityRuntimeException {

        try {
            Connection dbConnection = dataSource.getConnection();
            dbConnection.setAutoCommit(false);
            try {
                dbConnection.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
            } catch (SQLException e) {
                // Handling startup error for postgresql
                // Active SQL Transaction means that connection is not committed.
                // Need to commit before setting isolation property.
                if (dbConnection.getMetaData().getDriverName().contains(POSTGRESQL_DATABASE) &&
                        PG_ACTIVE_SQL_TRANSACTION_STATE.equals(e.getSQLState())) {
                    dbConnection.commit();
                    dbConnection.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
                }
            }
            return dbConnection;
        } catch (SQLException e) {
            String errMsg = "Error when getting a database connection object from the Identity data source.";
            throw IdentityRuntimeException.error(errMsg, e);
        }
    }

    /**
     * Returns Identity data source.
     *
     * @return data source
     */
    public DataSource getDataSource() {

        return dataSource;
    }

}
