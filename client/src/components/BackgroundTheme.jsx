import HeaderLeft from "../assets/waiting-room/header_left.png";
import HeaderRight from "../assets/waiting-room/header_right.png";
import "../styles/waiting-room.css";

const BackgroundTheme = () => {
  return (
    <div className="background-theme">
      <img src={HeaderLeft} alt="" className="bg-img-left" />
      <img src={HeaderRight} alt="" className="bg-img-right" />
    </div>
  );
};

export default BackgroundTheme;
