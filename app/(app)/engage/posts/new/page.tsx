import { redirect } from "next/navigation"

// Post creation moved to a Sheet on the /engage/posts list page
export default function NewPostPageRedirect() {
  redirect("/engage/posts")
}
