import { ProfileData, IconType } from "./types";

export const DEFAULT_PROFILE: ProfileData = {
    name: "Sai Studio AI Studio",
    title: "Creative Technologist",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwFVE5Sl-OZfck4DmlcX7lrvurUeVIJYbFUCxyboMMdwjF24E6i_vLFzPGP5-4keKaaNy0PbfUMJUD4m5wbhQDFYvGXMD762erVhFhcCB8Ob5894pnJBsQHzOoyfvCCV2vmWc1p9RgMDdhUPOxYqtRdy1wcZ27pKyI0G2-LssaLDWysVBAFTPv-czq9CdC90obxH-PCWL6GexT0cFWjag2CduUqKCT8jSLRv02dXS7ZMBtHQC_YAWzRjXJ2Eno8BpxJxMpSFmhaoc",
    contactText: "Contact",
    contactUrl: "mailto:hello@example.com",
    socials: [
        { id: "1", platform: IconType.Instagram, url: "#" },
        { id: "2", platform: IconType.LinkedIn, url: "#" },
        { id: "3", platform: IconType.Twitter, url: "#" },
        { id: "4", platform: IconType.Email, url: "mailto:test@test.com" },
        { id: "5", platform: IconType.GitHub, url: "#" },
        { id: "6", platform: IconType.YouTube, url: "#" },
        { id: "7", platform: IconType.Web, url: "#" },
        { id: "8", platform: IconType.Medium, url: "#" },
    ],
    projects: [
        {
            id: "p1",
            title: "Project Alpha: AI Art",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC01AXbkn27Q3y6tOWQnF0HifivVOQg3YIUjsUaZKGiQXpEuTR1eAidOLqkDriD7r6PSnGhbFnWBxNx9Gc9iXawBD_tgC1_k6hGua6fD6Gf3pIwnJkhtljfqESO2SJ4mX97qZ2B6SwYeQDF26SZ7SXdPWtDZPen-GLyhjptPqS2QH32RA4nvfBGQZVY0szyJntxvMZb02bW2uMAyh2h8ZL5D_OqZeLZjal8YL-8h0FwiuozalJznPIfTvxFbzpZG5aEcliBN8GaiKw",
            link: "#"
        },
        {
            id: "p2",
            title: "Project Beta: Generative",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAySn5NrEXbkj_y4towf9Xe7HXMihJxnO4qK6ktOfPsWwaht3BIvg8bTKF95DP3SuFCjITn6zFtFJgHXKHXnXm9m4yZMPHaK6o4xl4btAwlPSZGiq6-zu0U9OCoEqriNk6ogZ0sQ7bNAwlOLz_xtng_YSUHr_HEGkQK0yavRNIxHevcRMrBDqaCstFwKNmmjOJMm5Qj_qSImE3Vyk8MbLgWXTDnYCtqsJv3Z6BaqLaS1C2QoDaNusZOFBArJ-Wr0t_SRC4HRv0XbF0",
            link: "#"
        }
    ]
};

export const GIST_FILENAME = "neumorphic_profile_data.json";
