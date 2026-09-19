import { useState } from "react";
import { Link } from "react-router-dom";
import VideoModal from "../VideoModal";

interface HeroStyle1Props {
  data: {
    title: string;
    subTitle: string;
    btnText1: string;
    btnUrl1: string;
    videoBtnText: string;
    videoSrc: string;
    imgUrl: string;
  };
}

const HeroStyle1: React.FC<HeroStyle1Props> = ({ data }) => {
  const { title, subTitle, btnText1, btnUrl1, videoBtnText, videoSrc, imgUrl } =
    data;

  const [iframeSrc, setIframeSrc] = useState("about:blank");
  const [toggle, setToggle] = useState(false);

  const handelClick = () => {
    setIframeSrc(`${videoSrc}`);
    setToggle(!toggle);
  };

  const handelClose = () => {
    setIframeSrc("about:blank");
    setToggle(!toggle);
  };

  return (
    <>
      <section
        className="cs_hero cs_style_1 cs_type_3 position-relative"
        id="home"
      >
        <div className="container">
          <div className="cs_hero_content position-relative">
            <div className="row align-items-center cs_gap_y_40">
              <div className="col-lg-5 order-lg-2">
                <div
                  className="cs_hero_thumbnail cs_radius_15 position-relative aos fadeInRight"
                  data-aos="fade-right"
                  data-aos-duration="800"
                >
                  <img src={imgUrl} alt="Hero Image" />
                  <div className="cs_hero_shape_vector position-absolute">
                    <img src="/img/quarter-circle.svg" alt="Vector Shape" />
                  </div>
                  <div className="cs_volume_report cs_white_bg cs_radius_15 position-absolute">
                    <img src="/img/volume.jpg" alt="Volume report chart" />
                  </div>
                  <div className="cs_sells_report cs_white cs_radius_20 position-absolute">
                    <img src="/img/sells-report.jpg" alt="Sells report chart" />
                  </div>
                </div>
              </div>
              <div className="col-lg-7 order-lg-1">
                <div className="cs_hero_text position-relative z-2">
                  <h1
                    className="cs_hero_title cs_fs_68 aos fadeInDown"
                    data-aos="fade-down"
                    data-aos-duration="800"
                    dangerouslySetInnerHTML={{ __html: title }}
                  />
                  <p className="cs_hero_subtitle" dangerouslySetInnerHTML={{ __html: subTitle }} />
                  <div className="cs_btn_group position-relative">
                    <button
                      onClick={handelClick}
                      aria-label="Video open button"
                      className="cs_btn cs_style_1 cs_white_color cs_video_open fadeInLeft cursor-pointer fadeInRight"
                      data-aos="fade-right"
                      data-aos-duration="800"
                      style={{ backgroundColor: '#2d5a1b' }}
                    >
                      <span>{videoBtnText}</span>
                    </button>
                    <Link
                      to={btnUrl1}
                      aria-label="Register free button"
                      className="cs_btn cs_style_1 cs_outline cs_semibold cs_heading_color fadeInLeft"
                      data-aos="fade-left"
                      data-aos-duration="800"
                    >
                      <span className="cs_player_text">{btnText1}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="cs_blob_5 position-absolute" />
          </div>
        </div>
      </section>
      <VideoModal
        isTrue={toggle}
        iframeSrc={iframeSrc}
        handelClose={handelClose}
      />
    </>
  );
};

export default HeroStyle1;
