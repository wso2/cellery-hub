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

const ServiceTerms = (props) => {
    const {classes} = props;
    return (
        <div className={classes.content}>
            <Typography variant={"h5"} color={"inherit"}>
                Terms Of Service
            </Typography>
            <Divider className={classes.divider}/>
            <div className={classes.body}>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    The following are terms of a legal agreement between you and WSO2 Inc (“WSO2”). This is
                    the WSO2 web site including wso2.com and wso2.org. (“WSO2 Web Site”). Your registration
                    for, or use of the WSO2 Web Site and /or the services on the WSO2 Web Site (“Services”)
                    shall be deemed to be your acceptance of the terms contained herein (“Terms of Use”). If
                    you are agreeing to these Terms of Use on behalf of a company or other legal entity, you
                    represent that you have the authority to bind such entity to these Terms of Use. You agree
                    that WSO2 may make changes to these Terms of Use at any time without prior notice.
                    WSO2 will notify you of changes by posting updated versions on the WSO2 Web Site. Your
                    continued use of the WSO2 Web Site and/or the Services shall be deemed to be your
                    consent to such changes in the Terms of Use. In addition, WSO2 may make changes to the
                    Services at any time. This Terms of Use document is effective from July 2019.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                1. Certain Disclaimers
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You understand and agree that the Services are provided “AS-IS” and that WSO2 assumes
                    no responsibility for the timeliness, deletion, mis-delivery or failure to store any user
                    communications or personalization settings. You are responsible for obtaining access to the
                    service, and that access may involve third-party fees (such as Internet service provider or
                    airtime charges).
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You agree that you are responsible for your own use of the Services, for any posts you
                    make, and for any consequences thereof. You agree that you will use the Services in
                    compliance with all applicable local, state, national, and international laws, rules and
                    regulations, including any laws regarding the transmission of technical data exported from
                    your country of residence and all United States export control laws.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    The following materials posted on the WSO2 Web Site do not go through a moderation
                    process and therefore may contain technical inaccuracies or typographical errors. WSO2
                    assumes no responsibility regarding the accuracy of the information that is provided in
                    these items. The opinions in these items are of the submitter/author and should not be
                    ascribed to WSO2. By using the Services you acknowledge that any reliance on material
                    posted via the Service will be at your own risk.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ol>
                        <li>Blogs</li>
                        <li>Forum Topics</li>
                        <li>Comments</li>
                        <li>Wiki pages</li>
                        <li>Biographies</li>
                    </ol>
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    1.1. Links to External Sites
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    This site may contain links to other sites. WSO2 is not responsible for the content or
                    practices of other web sites.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    1.2 Aggregator
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    The WSO2 Web Site’s aggregator gathers web services related information (such as articles,
                    blogs, news items, etc.) published by various third parties by subscribing to external feeds.
                    WSO2 assumes no responsibility over the content or the practices of the source of these
                    items displayed on the aggregator.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    2. Story Submissionss
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    Story items that are submitted will only be published after successfully passing through a
                    moderation process.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    All stories submitted to the WSO2 Web Site are required to be original material of the
                    author and not in violation of any copyrights or other intellectual property laws. If the
                    content improves on already published content then references listed to those published
                    material are essential.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    WSO2 takes no responsibility for the content published in these stories, whether it be on
                    technical correctness or any other basis. Information in these publications may be changed
                    or updated without notice.
                    Read section 3 for copyright provisions.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    3. Copyrights
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    By submitting Content (as defined in Section 5 below), ideas, suggestions, documents or
                    proposals (“Contributions”) to WSO2 through the WSO2 Web Site ( you acknowledge and
                    agree that:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>your Contributions do not contain confidential or proprietary information;</li>
                        <li>WSO2 is not under any obligation of confidentiality, express or implied, with respect to the
                            Contributions;</li>
                        <li>WSO2 shall be entitled to use or disclose (or choose not to use or disclose) such
                            Contributions for any purpose, in any way, in any media worldwide;</li>
                        <li>WSO2 may have something similar to the Contributions already under consideration or in
                            development;</li>
                        <li>your Contributions automatically become the property of WSO2 without any obligation of
                            WSO2 to you; and</li>
                        <li>you are not entitled to any compensation or reimbursement of any kind from WSO2 under
                            any circumstances.</li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    All stories on the WSO2 Web Site are, unless otherwise stated, the property of WSO2 and by
                    submitting a story for publication you agree to assign all copyrights and other intellectual
                    property therein to WSO2. Copyright and other intellectual property laws protect these
                    materials. Reproduction or retransmission of the materials, in whole or in part, in any
                    manner, without the prior written consent of WSO2, is a violation of copyright law. To the
                    extent that the foregoing assignment is determined to be ineffective, with respect to
                    Content that you submit or make available for inclusion on the WSO2 Web Site, you agree
                    to grant to WSO2 the perpetual, irrevocable and fully sublicensable license to use,
                    distribute, reproduce, modify, adapt, publish, translate, publicly perform and publicly
                    display such Content (in whole or in part) and to incorporate such Content into other works
                    in any format or medium now known or later developed.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    The opinions in the forums, comments, Wiki pages and blog posts are of the individual
                    authors or users and should not be ascribed to WSO2.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    You agree to hold harmless and indemnify WSO2, and its subsidiaries, affiliates, officers,
                    agents, and employees from and against any third-party claim arising from or in any way
                    related to your use of the Service, including any liability or expense arising from all claims,
                    losses, damages (actual and consequential), suits, judgments, litigation costs and attorneys’
                    fees, of every kind and nature. In such a case, WSO2 will provide you with written notice of
                    such claim, suit or action.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    4. Copyright Information; Trademarks
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    It is our policy to respond to notices of alleged infringement that comply with the Digital
                    Millennium Copyright Act. If you believe that your work has been copied in a way that
                    constitutes copyright infringement, or your intellectual property rights have been otherwise
                    violated, please provide WSO2’s Copyright Agent the following information:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>an electronic or physical signature of the person authorized to act on behalf of the owner
                            of the copyright or other intellectual property interest;</li>
                        <li>a description of the copyrighted work or other intellectual property that you claim has been
                            infringed;</li>
                        <li>a description of where the material that you claim is infringing is located on the site;
                        </li>
                        <li>your address, telephone number, and email address;</li>
                        <li>a statement by you that you have a good faith belief that the disputed use is not authorized
                            by the copyright owner, its agent, or the law; and</li>
                        <li>a statement by you, made under penalty of perjury, that the above information in your
                            Notice is accurate and that you are the copyright or intellectual property owner or
                            authorized to act on the copyright or intellectual property owner’s behalf.
                        </li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    WSO2’s agent for notice of claims of copyright or other intellectual property infringement
                    can be reached as follows:
                    <ul>
                        <li><b>By mail</b> Attn: Copyright Agent WSO2 Inc. 4131 El Camino Real, Suite 200, Palo Alto, CA
                            94306, USA</li>
                        <li><b>By phone</b> (+1) 408 754 7388</li>
                        <li><b>By Fax</b> (+1) 408 689 4328</li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    The following trademarks and service marks and other WSO2 logos and product and service
                    names are trademarks of WSO2: “WSO2”, and “Oxygenating the Web Services Platform”.
                    Without WSO2’s prior permission, you agree not to display or use in any manner such
                    marks.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    5. Misuse of Resources
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    You understand that all information, data, text, software, music, sound, photographs,
                    graphics, video, messages, tags, or other materials (“Content”), whether publicly posted or
                    privately transmitted, are the sole responsibility of the person from whom such Content
                    originated. This means that you, and not WSO2, are entirely responsible for all Content that
                    you upload, post, email, transmit or otherwise make available via the service. WSO2 does
                    not control the Content posted via the service and, as such, does not guarantee the
                    accuracy, integrity or quality of such Content. You understand that by using the service, you
                    may be exposed to Content that is offensive, indecent or objectionable. Under no
                    circumstances will WSO2 be liable in any way for any Content, including, but not limited to,
                    any errors or omissions in any Content, or any loss or damage of any kind incurred as a
                    result of the use of any Content posted, emailed, transmitted or otherwise made available
                    via the service.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    You agree to not use the service to:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>upload, post, email, transmit or otherwise make available any Content that is unlawful,
                            harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous,
                            invasive of another’s privacy, hateful, or racially, ethnically or otherwise objectionable;
                        </li>
                        <li>harm minors in any way;</li>
                        <li>impersonate any person or entity, including, but not limited to, a WSO2 official, forum
                            leader, guide or host, or falsely state or otherwise misrepresent your affiliation with a
                            person or entity;</li>
                        <li>forge headers or otherwise manipulate identifiers in order to disguise the origin of any
                            Content transmitted through the service;</li>
                        <li>upload, post, email, transmit or otherwise make available any Content that you do not have a
                            right to make available under any law or under contractual or fiduciary relationships (such
                            as inside information, proprietary and confidential information learned or disclosed as part
                            of employment relationships or under nondisclosure agreements);</li>
                        <li>upload, post, email, transmit or otherwise make available any Content that infringes any
                            patent, trademark, trade secret, copyright or other proprietary rights (“Rights”) of any
                            party;</li>
                        <li>upload, post, email, transmit or otherwise make available any unsolicited or unauthorized
                            advertising, promotional materials, “junk mail,” “spam,” “chain letters,” “pyramid schemes,”
                            or any other form of solicitation;</li>
                        <li>upload, post, email, transmit or otherwise make available any material that contains
                            software viruses or any other computer code, files or programs designed to interrupt,
                            destroy or limit the functionality of any computer software or hardware or
                            telecommunications equipment; interfere with or disrupt the service or servers or networks
                            connected to the service, or disobey any requirements, procedures, policies or regulations
                            of networks connected to the service;</li>
                        <li>intentionally or unintentionally violate any applicable local, state, national or
                            international law, ordinance or regulation;</li>
                        <li>provide material support or resources (or to conceal or disguise the nature, location,
                            source, or ownership of material support or resources) to any organization(s) designated
                            by the United States government as a foreign terrorist organization pursuant to section 219
                            of the Immigration and Nationality Act;</li>
                        <li>“stalk” or otherwise harass another; and/or</li>
                        <li>collect or store personal data about other users in connection with the prohibited conduct
                            and activities set forth above.</li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    You acknowledge, consent and agree that WSO2 may access, preserve and disclose your account
                    information and Content if required to do so by law or in a good faith belief that such access
                    preservation or disclosure is reasonably necessary to:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ul>
                        <li>comply with legal process;</li>
                        <li>enforce these Terms of Use;</li>
                        <li>respond to claims that any Content violates the rights of third parties;</li>
                        <li>respond to your requests for customer service; or</li>
                        <li>protect the rights, property or personal safety of WSO2, its users and the public.</li>
                    </ul>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You understand that the Service and software embodied within the Service may include security
                    components that permit digital materials to be protected, and that use of these materials is subject
                    to usage rules set by WSO2 and/or content providers who provide content to the Service. You may not
                    attempt to override or circumvent any of the usage rules embedded into the Service. Any unauthorized
                    reproduction, publication, further distribution or public exhibition of the materials provided on
                    the service, in whole or in part, is strictly prohibited.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Using the WSO2 Web Site account for acts or content in violation of these Terms of Use may result in
                    disabling or blocking of your account without warning and take maximum legal action applicable
                    within law. If we determine (in our sole discretion) that your content has been used to submit any
                    such content we may remove such content from the site at any time without notice to you, and your
                    account will be considered for blocking or disabling in our sole discretion.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    6. Other User restrictions
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    As a condition to using certain Services, WSO2 may require to set up a user name and
                    password as set forth in the account registration procedure on the WSO2 Web Site. You will
                    provide WSO2 with true, accurate, current and complete information. You may not use
                    anyone else’s password. You are solely responsible for maintaining the confidentiality of
                    your account and password. You will promptly update your registration to keep it accurate,
                    current and complete. You agree to immediately notify WSO2 of any unauthorized use of
                    your password or accounts or any other breach of security. You also agree to sign out from
                    your accounts at the end of each session. WSO2 will not be responsible for any loss or
                    damage that may result if you fail to comply with these requirements. You will not employ
                    the use of automation, mashups, programs, robots or agents in the process of registering
                    your account.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    Where you are provided with an administrator user ID and password for accessing the
                    Services, you will be required to assign it to your administrator. You will be responsible
                    through your administrator, for authorizing and terminating individual user ID’s and
                    passwords and setting and modifying your users profiles and preferences for the Services
                    and specifying the access rights of the individual users to the Services. The administrator
                    may change the administrator’s or a user’s ID by contacting WSO2.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    You will be responsible for all activity occurring under your accounts and will comply with all
                    applicable local, state and foreign laws, treaties and regulations in connection with your use
                    of the Services, including without limitation, laws and regulations governing data privacy,
                    international communications and transmission of technical or personal data.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    The software and technology relating to the WSO2 Web Site and the Services are the
                    property of WSO2, its partners and affiliates. You agree not to copy, modify, lend, lease,
                    distribute, reverse engineer, sell, assign or otherwise transfer any right to the software or
                    technology. You agree not to modify the software in any manner or form or to use modified
                    versions of such software for any purpose including the unauthorized access to the
                    &nbsp;<Link target={"_blank"} href={"http://www.wso2.com/"}>
                        WSO2 Web Site</Link>.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    7. Revisions of Policy
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    WSO2 may at any time revise this Terms of Use document by updating this page. We will not send
                    individual email notifications on these updates. By using the WSO2 Web Site, you agree to be bound
                    by any such revisions and is therefore encouraged to periodically visit this page.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    8. Subscriptions and Mail notifications — Your Choice
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Our site allows users the opportunity to opt-out of receiving subscriptions and email notifications
                    at any point by updating the settings through your “user account”.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    9. Limitation of Liability; Disclaimer of Warranties.
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN “AS IS” AND
                    “AS AVAILABLE” BASIS. WSO2 AND ITS SUBSIDIARIES, AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, PARTNERS
                    AND LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING,
                    BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                    NON-INFRINGEMENT.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    YOU EXPRESSLY UNDERSTAND AND AGREE THAT WSO2 AND ITS SUBSIDIARIES, AFFILIATES, OFFICERS, EMPLOYEES,
                    AGENTS, PARTNERS AND LICENSORS SHALL NOT BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL,
                    SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES,INCLUDING, BUT NOT LIMITED TO, DAMAGES FOR LOSS OF
                    PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES (EVEN IF WSO2 HAS BEEN ADVISED OF THE
                    POSSIBILITY OF SUCH DAMAGES), RESULTING FROM:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <ol>
                        <li>THE USE OR THE INABILITY TO USE THE SERVICE;</li>
                        <li>THE COST OF PROCUREMENT OF SUBSTITUTE GOODS AND SERVICES RESULTING FROM ANY GOODS, DATA,
                            INFORMATION OR SERVICES PURCHASED OR OBTAINED OR MESSAGES RECEIVED OR TRANSACTIONS ENTERED
                            INTO THROUGH OR FROM THE SERVICE;
                        </li>
                        <li>UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA;</li>
                        <li>STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE; OR</li>
                        <li>ANY OTHER MATTER RELATING TO THE SERVICE.</li>
                    </ol>
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    10. General
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                These Terms of Use will be governed by and construed in accordance with the laws of the State of
                    California, without giving effect to its conflict of laws provisions or your actual state or country
                    of residence. Any claims, legal proceeding or litigation arising in connection with the service will
                    be brought solely in Santa Clara County, California, and you consent to the jurisdiction of such
                    courts. The failure of WSO2 to exercise or enforce any right or provision of these Terms of Use
                    shall not constitute a waiver of such right or provision. If any provision of the Terms of Use is
                    found by a court of competent jurisdiction to be invalid, the parties nevertheless agree that the
                    court should endeavor to give effect to the parties’ intentions as reflected in the provision, and
                    the other provisions of the Terms of Use remain in full force and effect. These Terms of Use
                    constitutes the entire agreement between you and WSO2 and governs your use of the service,
                    superseding any prior agreements between you and WSO2 with respect to the service.
                </Typography>
                <Typography variant={"h5"} gutterBottom>
                    11. Contact Us
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    If you find any content that is in contravention with our Terms of Use, or that you believe to be
                    malicious, please don’t hesitate to
                    &nbsp;<Link target={"_blank"} href={"https://wso2.com/contact"}>
                        contact us</Link>.
                </Typography>
                <div className={classes.bottomSpace} />
            </div>
        </div>
    );
};

ServiceTerms.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ServiceTerms);
