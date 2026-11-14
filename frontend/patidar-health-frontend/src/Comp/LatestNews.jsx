import React from 'react'

export default function LatestNews() {
  return (
    <div className="page-section bg-light">
        <div className="container">
            <h1 className="text-center wow fadeInUp">Latest News</h1>
            <div className="row mt-5">
                <div className="col-lg-4 py-2 wow zoomIn">
                    <div className="card-blog">
                        <div className="header">
                            <div className="post-category">
                                <a href="#">Covid19</a>
                            </div>
                            <a href="blog-details.html" className="post-thumb">
                                <img src="/assets/img/blog/news-covid.svg" alt="Healthcare and coronavirus prevention" />
                            </a>
                        </div>
                        <div className="body">
                            <h5 className="post-title"><a href="blog-details.html">List of Countries without Coronavirus case</a></h5>
                            <div className="site-info">
                                <div className="avatar mr-2">
                                    <div className="avatar-img">
                                        <img src="/assets/img/person/roger-adams.svg" alt="Roger Adams" />
                                    </div>
                                    <span>Roger Adams</span>
                                </div>
                                <span className="mai-time" /> 1 week ago
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 py-2 wow zoomIn">
                <div className="card-blog">
                    <div className="header">
                        <div className="post-category">
                            <a href="#">Covid19</a>
                        </div>
                        <a href="blog-details.html" className="post-thumb">
                            <img src="/assets/img/blog/news-recovery.svg" alt="Patient recovering in a hospital" />
                        </a>
                    </div>
                    <div className="body">
                    <h5 className="post-title"><a href="blog-details.html">Recovery Room: News beyond the pandemic</a></h5>
                    <div className="site-info">
                        <div className="avatar mr-2">
                        <div className="avatar-img">
                            <img src="/assets/img/person/roger-adams.svg" alt="Roger Adams" />
                        </div>
                        <span>Roger Adams</span>
                        </div>
                        <span className="mai-time" /> 4 weeks ago
                    </div>
                    </div>
                </div>
                </div>
                <div className="col-lg-4 py-2 wow zoomIn">
                <div className="card-blog">
                    <div className="header">
                        <div className="post-category">
                            <a href="#">Covid19</a>
                        </div>
                        <a href="blog-details.html" className="post-thumb">
                            <img src="/assets/img/blog/news-nutrition.svg" alt="Healthy food and nutrition" />
                        </a>
                    </div>
                    <div className="body">
                    <h5 className="post-title"><a href="blog-details.html">What is the impact of eating too much sugar?</a></h5>
                    <div className="site-info">
                        <div className="avatar mr-2">
                            <div className="avatar-img">
                                <img src="/assets/img/person/diego-simmons.svg" alt="Diego Simmons" />
                            </div>
                            <span>Diego Simmons</span>
                        </div>
                        <span className="mai-time" /> 2 months ago
                    </div>
                    </div>
                </div>
                </div>
                <div className="col-12 text-center mt-4 wow zoomIn">
                    <a href="blog.html" className="btn btn-primary">Read More</a>
                </div>
            </div>
        </div>
    </div>
  )
}
