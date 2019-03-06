import styled from "@emotion/styled";
import { Color } from "csstype";
import hexToRgba from "hex-to-rgba";
import get from "lodash/get";
import map from "lodash/map";
import * as React from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Conference } from "../../schema/Conference";
import { Contact, ContactType } from "../../schema/Contact";
import { Theme } from "../../schema/Theme";
import connect from "../components/connect";
import { dayToFinnishLocale } from "../date-utils";

const TweetTemplateContainer = styled.div``;

interface TweetPageContainerProps {
  primaryColor: Color;
  secondaryColor: Color;
  texture: string;
}

const TweetPageContainer = styled.div`
  background-image: ${({
    primaryColor,
    secondaryColor,
    texture,
  }: TweetPageContainerProps) => `linear-gradient(
      ${primaryColor},
      ${hexToRgba(secondaryColor, 0.79)}
    ),
    url("${texture}")`};
  background-size: cover;
  position: relative;
  width: 880px;
  height: 440px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  color: white;
`;

const TweetInfoContainer = styled.div`
  padding: 3em 0 3em 3em;
`;

const TweetContainer = styled.div`
  position: relative;
  margin-top: 2em;
  padding: 0.25em;
  max-width: 880px;
  background-color: #fff6c8;
`;
const TweetText = styled.span`
  margin-right: 0.5em;
`;
const TweetCopyButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
`;

const TweetRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
`;

const TweetLogo = styled.img`
  max-width: 10em;
  margin-left: -0.5em;
`;

const TweetConferenceDays = styled.h3``;

const TweetImageContainer = styled.div`
  padding: 3em;
`;

interface TweetImageProps {
  isCircle: boolean;
  src: HTMLImageElement["src"];
}

const TweetImage = styled.img`
  width: 100%;
  box-sizing: border-box;
  clip-path: ${({ isCircle }: TweetImageProps) =>
    isCircle ? "circle(9em at center)" : ""};
` as React.FC<TweetImageProps>;

const TweetSpeakerName = styled.h1`
  padding-top: 1em;
  font-size: 300%;
`;

const TweetSpeakerDescription = styled.h2`
  padding-top: 0.5em;
  font-size: 200%;
`;

interface SpeakerTweetTemplateProps {
  conference?: Conference;
  contact?: Contact;
  theme: Theme;
  id: string;
}

function SpeakerTweetTemplate({
  conference,
  contact,
  theme,
  id,
}: SpeakerTweetTemplateProps) {
  if (!conference) {
    return null;
  }

  const { schedules } = conference;
  const conferenceDays = map(schedules, ({ day }) => dayToFinnishLocale(day));
  const firstDay = conferenceDays[0];
  const lastDay = conferenceDays[conferenceDays.length - 1];
  const { about, name, image, talks, type } = contact || {
    about: "",
    name: "",
    image: { url: "" },
    talks: [],
    type: null,
  };
  const isSponsor = type && type.includes(ContactType.SPONSOR);
  const description = isSponsor
    ? about
    : Array.isArray(talks) && talks.length > 0 && talks[0].title;
  // TODO: Set up conference.hashtag (should not contain #)
  const tweetTextToCopy = `Learn more about ${description} by ${name} at #${conference.name
    .split(" ")
    .join("")} (${firstDay}-${lastDay})`;

  return (
    <TweetTemplateContainer>
      <TweetPageContainer
        id={id}
        primaryColor={theme.colors.primary}
        secondaryColor={theme.colors.secondary}
        texture={theme.texture.url}
      >
        <TweetInfoContainer>
          <TweetRow>
            <TweetLogo src={theme.logos.white.withText.url} />
            <TweetConferenceDays>
              {firstDay}-{lastDay}
            </TweetConferenceDays>
          </TweetRow>
          <TweetSpeakerName>{name}</TweetSpeakerName>
          <TweetSpeakerDescription>{description}</TweetSpeakerDescription>
        </TweetInfoContainer>
        <TweetImageContainer>
          <TweetImage isCircle={!isSponsor} src={image.url} />
        </TweetImageContainer>
      </TweetPageContainer>
      <TweetContainer>
        <TweetText>{tweetTextToCopy}</TweetText>
        <CopyToClipboard
          text={tweetTextToCopy}
          onCopy={() => alert("Copied to clipboard")}
        >
          <TweetCopyButton>&#x2398;</TweetCopyButton>
        </CopyToClipboard>
      </TweetContainer>
    </TweetTemplateContainer>
  );
}

const ConnectedSpeakerTweetTemplate = connect(
  "/graphql",
  `
query SpeakerTweetTemplateQuery($conferenceId: ID!, $contactName: String!) {
  contact(contactName: $contactName, conferenceId: $conferenceId) {
    name
    about
    image {
      url
    }
    talks {
      title
    }
    type
  }
  conference(id: $conferenceId) {
    name
    slogan
    schedules {
      day
    }
    locations {
      city
      country {
        name
      }
    }
  }
}
  `,
  {},
  ({ conferenceId, contactName }) => ({ conferenceId, contactName })
)(SpeakerTweetTemplate);

ConnectedSpeakerTweetTemplate.filename = "speaker-tweet";

// TODO: Better use enums here
ConnectedSpeakerTweetTemplate.variables = [
  {
    id: "conferenceId",
    query: `query ConferenceIdQuery {  
  allConferences {
    id
    name
  }
}`,
    mapToCollection({ allConferences }) {
      return allConferences;
    },
    mapToOption({ id, name }) {
      return {
        value: id,
        label: name,
      };
    },
  },
  {
    id: "contactName",
    query: `query SpeakerQuery($conferenceId: ID!) {
  conference(id: $conferenceId) {
    speakers {
      name
    }
    sponsors {
      name
    }
  }
}`,
    mapToCollection({ conference, ...rest }) {
      return []
        .concat(get(conference, "speakers"), get(conference, "sponsors"))
        .filter(Boolean);
    },
    mapToOption({ name }) {
      return {
        value: name,
        label: name,
      };
    },
  },
];

export default ConnectedSpeakerTweetTemplate;