import svgPaths from "./svg-t1ggfj65ra";
import imgFrame3 from "figma:asset/d4750969fc6e1ecdb0e81241cf229682cfd97a4a.png";
import imgImage1 from "figma:asset/84229552ad15a973e3ff4d1f571f1de3e034300c.png";

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-full items-start overflow-clip p-[32px] relative shrink-0 w-[320px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover size-full" src={imgFrame3} />
        <div className="absolute bg-[rgba(0,0,0,0.4)] inset-0" />
      </div>
      <div className="absolute h-[361px] left-[32px] shadow-[-3px_4px_22.5px_18px_rgba(0,0,0,0.22)] top-[358px] w-[249px]" data-name="image 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
      </div>
      <ul className="block font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[12px] text-white w-[min-content]">
        <li className="css-4hzbpn ms-[18px]">
          <span className="leading-[24px]">Calendar helps you mark days</span>
        </li>
      </ul>
      <ul className="block font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[12px] text-white w-[min-content]">
        <li className="css-4hzbpn ms-[18px]">
          <span className="leading-[24px]">Calendar helps you mark days</span>
        </li>
      </ul>
      <ul className="block font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[12px] text-white w-[min-content]">
        <li className="css-4hzbpn ms-[18px]">
          <span className="leading-[24px]">Calendar helps you mark days</span>
        </li>
      </ul>
      <ul className="block font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[12px] text-white w-[min-content]">
        <li className="css-4hzbpn ms-[18px]">
          <span className="leading-[24px]">Calendar helps you mark days</span>
        </li>
      </ul>
    </div>
  );
}

function MdiPillMultiple() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="mdi:pill-multiple">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="mdi:pill-multiple">
          <path d={svgPaths.p14c7b300} fill="var(--fill-0, #6D6D6D)" id="Vector" />
          <path d={svgPaths.p337ca800} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[120px]" data-name="logo">
      <MdiPillMultiple />
      <p className="css-ew64yg font-['Hanken_Grotesk:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[26px] text-white">Pilliox</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Logo />
      <p className="css-4hzbpn font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[24px] min-w-full relative shrink-0 text-[#888] text-[16px] w-[min-content]" style={{ fontFeatureSettings: "'cpsp'" }}>
        Track your daily medication and status
      </p>
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="bg-[#404040] flex-[1_0_0] h-[43px] min-h-px min-w-px relative rounded-[14px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#2a2a2a] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8.667px] py-[4.667px] relative size-full">
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[16px] text-center text-white">Login</p>
        </div>
      </div>
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div className="flex-[1_0_0] h-[43px] min-h-px min-w-px relative rounded-[14px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[0.667px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center p-[8.667px] relative size-full">
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#888] text-[16px] text-center">Sign Up</p>
        </div>
      </div>
    </div>
  );
}

function TabList() {
  return (
    <div className="bg-[#2a2a2a] relative rounded-[14px] shrink-0 w-full" data-name="Tab List">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[2px] py-[3px] relative w-full">
          <PrimitiveButton />
          <PrimitiveButton1 />
        </div>
      </div>
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex h-[14px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[14px] relative shrink-0 text-[14px] text-white">Email</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#1a1a1a] h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[8px] relative size-full">
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#888] text-[16px]">your@email.com</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#3a3a3a] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[70px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel />
      <Input />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="content-stretch flex h-[14px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[14px] relative shrink-0 text-[14px] text-white">Password</p>
    </div>
  );
}

function RiEyeFill() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="ri:eye-fill">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="ri:eye-fill">
          <path d={svgPaths.p3d103e40} fill="var(--fill-0, #888888)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#1a1a1a] h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#888] text-[16px]">Password</p>
          <RiEyeFill />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#3a3a3a] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[70px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel1 />
      <Input1 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#155dfc] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[178px] py-[10px] relative w-full">
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[16px] text-center text-white">Login</p>
        </div>
      </div>
    </div>
  );
}

function AuthForm() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="AuthForm">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[32px] items-start relative size-full">
        <Container />
        <Container1 />
        <Button />
      </div>
    </div>
  );
}

function PrimitiveDiv() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] h-[328px] items-start relative shrink-0 w-full" data-name="Primitive.div">
      <TabList />
      <AuthForm />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[6.25%_7.74%_6.29%_7.81%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.8902 17.4926">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p3f20ec00} fill="var(--fill-0, #F44336)" fillRule="evenodd" id="Vector" opacity="0.987" />
          <path clipRule="evenodd" d={svgPaths.p15800} fill="var(--fill-0, #FFC107)" fillRule="evenodd" id="Vector_2" opacity="0.997" />
          <path clipRule="evenodd" d={svgPaths.p21d1cc20} fill="var(--fill-0, #448AFF)" fillRule="evenodd" id="Vector_3" opacity="0.999" />
          <path clipRule="evenodd" d={svgPaths.p1af26300} fill="var(--fill-0, #43A047)" fillRule="evenodd" id="Vector_4" opacity="0.993" />
        </g>
      </svg>
    </div>
  );
}

function MaterialIconThemeGoogle() {
  return (
    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="material-icon-theme:google">
      <Group />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#404040] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-center px-[116px] py-[10px] relative w-full">
          <MaterialIconThemeGoogle />
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[16px] text-center text-white">Continue with Google</p>
        </div>
      </div>
    </div>
  );
}

function LogosFacebook() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="logos:facebook">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_35_74)" id="logos:facebook">
          <path d={svgPaths.p3ef31c80} fill="var(--fill-0, #1877F2)" id="Vector" />
          <path d={svgPaths.p1634fa00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_35_74">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#404040] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-center px-[106px] py-[10px] relative w-full">
          <LogosFacebook />
          <p className="css-ew64yg font-['Plus_Jakarta_Sans:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[16px] text-center text-white">Continue with Facebook</p>
        </div>
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-[#1a1a1a] content-stretch flex flex-col gap-[17px] items-center p-[32px] relative shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] shrink-0 w-[480px]" data-name="Card">
      <Frame1 />
      <PrimitiveDiv />
      <p className="css-ew64yg font-['Plus_Jakarta_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#888] text-[14px]">Or</p>
      <Button1 />
      <Button2 />
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative rounded-[16px] size-full">
      <div className="flex flex-row items-center self-stretch">
        <Frame />
      </div>
      <Card />
    </div>
  );
}