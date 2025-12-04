import { ProfileData } from "../types";
import { GIST_FILENAME } from "../constants";

export const fetchGistData = async (gistId: string, token: string): Promise<ProfileData | null> => {
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        if (!response.ok) throw new Error(`Failed to fetch gist: ${response.statusText}`);
        const data = await response.json();
        const fileContent = data.files[GIST_FILENAME]?.content;
        if (!fileContent) return null;
        return JSON.parse(fileContent) as ProfileData;
    } catch (error) {
        console.error("Error fetching gist:", error);
        throw error;
    }
};

export const createGist = async (token: string, data: ProfileData): Promise<string> => {
    try {
        const response = await fetch("https://api.github.com/gists", {
            method: "POST",
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                description: "Neumorphic Profile Data",
                public: true,
                files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
            }),
        });
        if (!response.ok) throw new Error(`Failed to create gist: ${response.statusText}`);
        const responseData = await response.json();
        return responseData.id;
    } catch (error) {
        console.error("Error creating gist:", error);
        throw error;
    }
};

export const updateGistData = async (gistId: string, token: string, data: ProfileData): Promise<void> => {
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: "PATCH",
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
            }),
        });
        if (!response.ok) throw new Error(`Failed to update gist: ${response.statusText}`);
    } catch (error) {
        console.error("Error updating gist:", error);
        throw error;
    }
};
