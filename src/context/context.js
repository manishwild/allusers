import { createContext, useEffect, useState } from 'react'

import axios from 'axios'
import  {mockUser}  from './mockData/mockUser';
import  {mockData } from './mockData/mockRepos';
import  {mockFollowers } from './mockData/mockFollowers';



const rootUrl = 'https://api.github.com'

const AppContext = createContext()

const AppProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [repos, setRepos] = useState(mockData)
  const [followers, setFollowers] = useState(mockFollowers)
  const [requests, setRequests] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ show: false, msg: '' })

  //seach gituser function
  const searchGithubUser = async (user) => {
    ToggleError()
    setIsLoading(true)
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    )
    if (response) {
      setGithubUser(response.data)
      const { login, followers_url } = response.data
      // // repos
      //       axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) => setRepos(response.data))
      // //followers
      //       axios(`${followers_url}?per_page=100`).then((response) =>
      //         setfollowers(response.data)
      //       )

      // this way we get all response at same time
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results
          const status = 'fulfilled'
          if (repos.status === status) {
            setRepos(repos.value.data)
          }
          if (followers.status === status) {
            setFollowers(followers.value.data)
          }
        })
        .catch((err) => console.log(err))
    } else {
      ToggleError(true, 'There is no user with that UserName')
    }
    checkRequest()
    setIsLoading(false)
  }

  // check request
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data
        // remaining = 0
        setRequests(remaining)
        if (remaining === 0) {
          ToggleError(true, 'Sorry, You have exceeded your hourly rate limit!')
        }
      })
      .catch((err) => console.log(err))
  }

  const ToggleError = (show = false, msg = '') => {
    setError({ show, msg })
  }

  // using checkrequest all callback function
  useEffect(checkRequest, [])

  return (
    <AppContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        isLoading,
        searchGithubUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }
