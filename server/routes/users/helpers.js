import { ManagementClient } from "auth0";
import config from "../../config";

export const queryToLucene = (string) =>
	string.length < 3 ? `name:${string}*` : `name:*${string}*`;

export const auth0 = new ManagementClient({
	domain: config.AUTH0_DOMAIN,
	clientId: config.AUTH0_CLIENT_ID,
	clientSecret: config.AUTH0_CLIENT_SECRET,
});