import React, { useEffect, useState } from 'react'

function Movie() {
    const [movielist, setMovieList] = useState([])
    
    const getMovie = () => {
        fetch("https://api.themoviedb.org/3/discover/movie?api_key=7c69402c2a3a16a5d71f3e890a1043d4")
        .then(res => res.json())
        .then(json => {
            console.log(json.results)
            setMovieList(json.results) // Set the movie data to state
        })
        .catch(err => console.error('Error fetching movies:', err))
    }

    useEffect(() => {
        getMovie()
    }, [])

    console.log(movielist)

    return (
        <div>
            {movielist.map((movie) => (
                <img style={{width:'300px',height:'250px',marginLeft:"30px",marginTop:'30px'}}       src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                />
            ))}
        </div>
    )
}

export default Movie