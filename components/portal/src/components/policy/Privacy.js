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

import Divider from "@material-ui/core/Divider";
import Link from "@material-ui/core/Link";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    divider: {
        marginBottom: theme.spacing(4)
    },
    body: {
        color: "#464646"
    },
    section: {
        marginBottom: theme.spacing(2)
    },
    bottomSpace: {
        height: 50
    }
});

const Privacy = (props) => {
    const {classes} = props;
    return (
        <div className={classes.content}>
            <Typography variant={"h5"} color={"inherit"}>
                Privacy Policy
            </Typography>
            <Divider className={classes.divider}/>
            <div className={classes.body}>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    At WSO2, we recognize that privacy is important. This privacy policy applies to the Cellery Hub
                    site and services offered at&nbsp;<Link target={"_blank"} href={"https://wso2-cellery.github.io/"}>
                    Cellery</Link> and any other site to which a link to these terms may appear. We’ve set out below the
                    details of how we collect, use, share and secure the personal information you provide. “You” or
                    “Your” means the person visiting the abovementioned Cellery Hub website (the “Site”) or using any
                    services on it. “We” “us” and “our” means WSO2 Inc.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHAT INFORMATION DO WE COLLECT?
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    When you register on the Cellery Hub site for updates or sign up for a service, or when you login
                    through single sign on through our designated federated identity providers we may ask that you
                    submit some or all of the following information:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>Your user name</li>
                        <li>Email address</li>
                        <li>Profile image URL from github or google, if applicable</li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You may choose to visit our site anonymously, without providing any of the above information.
                    However certain services on our site – may require that such details be entered on a mandatory
                    basis. This is because those details are essential for us to be able to provide you with such
                    services.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We also collect certain standard information that your browser sends to every website you visit,
                    such as your IP address, browser type and language, access times, and referring website addresses.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHY DO WE COLLECT YOUR INFORMATION?
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    The information we collect from you maybe used in one of the following ways:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>To perform the services requested (for instance if you’ve signed up for our updates we use
                            your information to get in touch with you regarding new information on Cellery Hub).
                        </li>
                        <li>To improve our website (we continually strive to improve our website offerings based on the
                            type of content our users click on or download).
                        </li>
                        <li>To conduct analysis on how effective our marketing campaigns are, how our products and
                            services are used or downloaded and to track lead generation for our sales process.
                        </li>
                        <li>To create your online profile which we create for every user who registers on our site or
                            for a service.
                        </li>
                        <li>If you’ve indicated to us that you are interested in certain areas or subjects when you give
                            us your contact details and wish to be updated on our events and workshops surrounding them,
                            we may send marketing material, event invitations and updates –
                        </li>
                        <li>To send you important updates related to the site or the services you use.</li>
                        <li>We track and analyze your actions on our website such as navigation, number of visits,
                            downloads and search items to gain a better understanding of our visitors and their
                            movements through the site. Please see our cookie policy on how we use and store cookies.
                        </li>
                    </ul>
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHO IS YOUR INFORMATION SHARED WITH?
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We do not sell, trade or otherwise share your information with outside parties. However, we do share
                    your information with WSO2 subsidiaries, affiliates, service providers and partners who assist us in
                    operating our website, conducting our business or servicing you.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We sometimes need to give our service providers who help us run our website and services access to
                    the data we have in order for them to perform those services. They are only authorized to use
                    information that is strictly relevant for them to perform their tasks and we ensure that they are
                    under obligations of confidentiality to us so that your data is secure.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We may share your data with our subsidiaries or affiliates within our corporate group. WSO2’s parent
                    company is WSO2 Inc. and is located in the United States of America. Our affiliates are WSO2 UK
                    Limited (located in the United Kingdom), WSO2 Lanka (Private) Limited (located in Sri Lanka) and
                    WSO2 Brasil Tecnologia E Software Ltda (located in Brazil), WSO2 Germany GmbH ( located in Germany)
                    and WSO2 Australia Pty Limited ( located in Australia). We share information within this group
                    because these entities also carry out support, marketing, account management and technical
                    operations for WSO2 that are relevant to the provision of the website and services
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    WSO2 complies with the EU-U.S. Privacy Shield Framework as set forth by the U.S. Department of
                    Commerce regarding the collection, use, and retention of personal information transferred from the
                    European Union to the United States. WSO2 has certified to the Department of Commerce that it
                    adheres to the Privacy Shield Principles. If there is any conflict between the terms in this privacy
                    policy and the Privacy Shield Principles, the Privacy Shield Principles shall govern. To learn more
                    about the Privacy Shield program, and to view our certification, please visit&nbsp;
                    <Link target={"_blank"} href={"https://www.privacyshield.gov/"}>https://www.privacyshield.gov/
                    </Link>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    Data transferred from the European Union to other affiliate entities located around the world is
                    transferred on the basis of Data Transfer Agreements containing EU Model Clauses set out by the
                    European Commission.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We may also release your information when we believe release is appropriate to comply with the law,
                    enforce our privacy policy or protect our or others’ rights, property or safety.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    HOW DO WE PROCESS YOUR DATA?
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We will only collect and process personal data about you where we have lawful bases. Lawful bases
                    include consent (where you have given consent), contract (where processing is necessary for the
                    performance of a contract with you) and legitimate interests (such as to protect you, us, or others
                    from security threats, comply with laws that apply to us and to enable or administer our business
                    through consolidated reporting, customer service requests etc.)
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Where we rely on your consent to process personal data, you have the right to withdraw or decline
                    your consent at any time and where we rely on legitimate interests, you have the right to object.
                    If you have any questions about the lawful bases upon which we collect and use your personal data
                    or wish to withdraw consent or object, please email our Data Protection Officer at&nbsp;
                    <Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link>.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    SECURITY OF YOUR DATA
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We implement security safeguards designed to protect your data, such as HTTPS. We regularly monitor
                    our systems for possible vulnerabilities and attacks. However, we cannot warrant the security of any
                    information that you send us. There is no guarantee that data may not be accessed, disclosed,
                    altered, or destroyed by breach of any of our physical, technical, or managerial safeguards.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    YOUR RIGHTS TO YOUR DATA AND HOW TO MANAGE YOUR PREFERENCES
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We may retain your information for a period of time consistent with the original purpose of
                    collection. For instance, we may retain your information during the time in which you have an
                    account to use our website or services. We also may retain your information during the period of
                    time needed for WSO2 to pursue our legitimate business interests, conduct audits, comply with our
                    legal obligations, resolve disputes and enforce our agreements. At the end of these periods, we
                    ensure that your data is deleted securely using industry standard methodology.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You have the right to access your data. If information pertaining to you as an individual has been
                    submitted to us then you have the right to access, correct, or edit your data. If you wish, we can
                    provide all the personal information on our records to you or to someone you nominate in a portable
                    format as well. Our contact details are provided at the bottom of the page or you can reach out to
                    us as&nbsp;<Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link>. All you have to
                    do is to request, and we are happy to help.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You can ask us to stop using all or some of your personal data (e.g., if we have no legal right to
                    keep using it) or to limit our use of it (e.g., if your personal data is inaccurate or unlawfully
                    held).
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You have the right to delete your data from our website at any time you choose, and unsubscribe from
                    any Cellery mailing lists you are on. You can unsubscribe from our emails by clicking on the
                    unsubscribe link which is at the bottom of mails sent through mailing lists. You can also contact us
                    on the email address(es) provided at the bottom of this notice, if you would like us to this on your
                    behalf.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We only ever retain your personal data even after you have ceased using our services, requested to
                    unsubscribe or delete your data only if reasonably necessary to comply with our legal obligations
                    (including law enforcement requests), meet regulatory requirements, resolve disputes, maintain
                    security, prevent fraud and abuse, or fulfill your request to “unsubscribe” from further messages
                    from us.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    THIRD PARTY OFFERINGS AND SERVICES
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    At our discretion, we may include or offer third party products or services on our site. These third
                    party sites have separate and independent privacy policies. We have no responsibility or liability
                    for the content and activities of these linked sites. We encourage you to review the privacy
                    statements of those websites to understand how your data is secured by them. Nonetheless, we seek to
                    protect the integrity of our site and welcome any feedback about these sites.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    INFORMATION ABOUT OUR WEBSITE
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    This privacy policy applies only to information collected through the Sites and not to information
                    collected offline. Please also visit our Terms of Use section relating to use, disclaimers,
                    indemnities, and limitations of liability governing the use of our site and services at&nbsp;
                    <Link target={"_blank"} href={"/policy/tos"}>Terms of Service</Link>
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    CHANGES TO OUR PRIVACY POLICY
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We reserve the right to amend this privacy policy at any time. We will not send individual email
                    notifications on the updates. Any amendments will be posted on this page. You are therefore
                    encouraged to visit this page periodically.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    By using the Sites, you consent to our privacy policy and any revisions thereto. If you do not agree
                    with our privacy policy or any changes we make to it, you may delete your profile.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    DISPUTE RESOLUTION MECHANISMS
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    In compliance with the Privacy Shield Principles, we commit to resolving complaints about our
                    collection or use of your personal information. EU individuals with inquiries or complaints
                    regarding our Privacy Shield policy should first contact us at:&nbsp;
                    <Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link>.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    WSO2 has committed to refer unresolved Privacy Shield complaints to JAMS, an alternative dispute
                    resolution provider located in the United States. If you do not receive timely acknowledgment of
                    your complaint from us, or if we have not addressed your complaint to your satisfaction, please
                    contact or visit https://www.jamsadr.com/eu-us-privacy-shield for more information or to file a
                    complaint. The services of JAMS are provided at no cost to you. Under certain conditions, more fully
                    described on the&nbsp;<Link target={"_blank"} href={"https://www.privacyshield.gov/"}>Privacy
                    Shield website
                    </Link>, you may invoke binding arbitration when other dispute resolution procedures have been
                    exhausted.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Within the USA, we are also subject to the investigatory and enforcement powers of the Federal Trade
                    Commission (FTC).
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    CONTACT US
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    For further information about our privacy policy or any concerns or complaints,
                    please contact our Data Protection Officer at&nbsp;
                    <Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link>.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <b>For EU/EEA/Switzerland residents:</b>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    If you are located within the European Union, the European Economic Area or Switzerland, WSO2 UK
                    Limited will be the controller of your personal data provided to, or collected by or for, or
                    processed in connection with our services.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    If you have any issues with regard to your data security on our website, then in addition to
                    informing us, you also have the right to write directly to the independent data protection
                    monitoring organization in your country. Within the UK, this is the&nbsp;
                    <Link target={"_blank"} href={"https://ico.org.uk/"}>Information Commissioner’s Office (ICO)</Link>.
                    The ICO is the UK’s independent authority set up to uphold information rights in the public
                    interest, promoting openness by public bodies and data privacy for
                    individuals. Please do email our data protection officer at&nbsp;
                    <Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link> if you have any issues,
                    concerns or questions regarding your personal data and we are happy to help.
                </Typography>
                <div className={classes.bottomSpace}/>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <b>Effective July 13, 2019</b>
                </Typography>
                <div className={classes.bottomSpace}/>
            </div>
        </div>
    );
};

Privacy.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Privacy);
